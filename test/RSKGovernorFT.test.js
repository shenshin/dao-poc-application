/* const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs'); */
const { expect } = require('chai');
const hre = require('hardhat');

async function deployContract(name, ...params) {
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();
  return contract;
}

describe('Governance', () => {
  let deployer;
  let voter1;
  let voter2;
  let voter3;
  let team;
  let rifToken;
  let rifVoteToken;
  let governor;
  let proposalId;

  const totalRifSupply = hre.ethers.BigNumber.from(1000);
  const voterRifAmount = hre.ethers.BigNumber.from(100);
  const treasuryRifAmount = hre.ethers.BigNumber.from(700);

  before(async () => {
    [deployer, voter1, voter2, voter3, team] = await hre.ethers.getSigners();
    rifToken = await deployContract('RIFToken', totalRifSupply);
    rifVoteToken = await deployContract('RIFVoteToken', rifToken.address);
    governor = await deployContract('RSKGovernorFT', rifVoteToken.address);
  });

  describe('RIF / RIFVote tokens', () => {
    it('RIF total supply should be minted', async () => {
      expect(await rifToken.totalSupply()).to.equal(totalRifSupply);
    });

    it('RIFVote decimals should equal RIF decimals', async () => {
      expect(await rifVoteToken.decimals()).to.equal(await rifToken.decimals());
    });

    it('The deployer should transfer all RIF tokens to the Voters equally', async () => {
      const tx1 = rifToken.transfer(voter1.address, voterRifAmount);
      await expect(tx1)
        .to.emit(rifToken, 'Transfer')
        .withArgs(deployer.address, voter1.address, voterRifAmount);
      const tx2 = rifToken.transfer(voter2.address, voterRifAmount);
      await expect(tx2)
        .to.emit(rifToken, 'Transfer')
        .withArgs(deployer.address, voter2.address, voterRifAmount);
      const tx3 = rifToken.transfer(voter3.address, voterRifAmount);
      await expect(tx3)
        .to.emit(rifToken, 'Transfer')
        .withArgs(deployer.address, voter3.address, voterRifAmount);
    });

    it('The deployer should transfer the rest of RIF tokens to the Governance Treasury', async () => {
      const tx = rifToken.transfer(governor.address, treasuryRifAmount);
      await expect(tx)
        .to.emit(rifToken, 'Transfer')
        .withArgs(deployer.address, governor.address, treasuryRifAmount);
    });

    it('voters should approve the RIF allowance for RIFVote', async () => {
      const txs = [voter1, voter2, voter3].map((voter) => ({
        voter,
        promise: rifToken.connect(voter).approve(rifVoteToken.address, voterRifAmount),
      }));
      await Promise.all(txs.map((tx) => expect(tx.promise).to.emit(rifToken, 'Approval').withArgs(
        tx.voter.address,
        rifVoteToken.address,
        voterRifAmount,
      )));
    });

    it('each voter allowance for RIFVote should be set on the RIF token', async () => {
      const allowances = await Promise.all(
        [voter1, voter2, voter3].map((voter) => rifToken.allowance(
          voter.address,
          rifVoteToken.address,
        )),
      );
      allowances.forEach((allowance) => expect(allowance).to.equal(voterRifAmount));
    });

    it('voters should deposit underlying tokens and mint the corresponding number of wrapped tokens', async () => {
      const txs = [voter1, voter2, voter3].map((voter) => ({
        voter,
        promise: rifVoteToken.connect(voter).depositFor(voter.address, voterRifAmount),
      }));
      await Promise.all(txs.map((tx) => expect(tx.promise).to.emit(rifVoteToken, 'Transfer').withArgs(
        hre.ethers.constants.AddressZero,
        tx.voter.address,
        voterRifAmount,
      )));
    });

    it('voters should now own the RIFVote tokens', async () => {
      const balances = await Promise.all(
        [voter1, voter2, voter3].map((voter) => rifVoteToken.balanceOf(voter.address)),
      );
      balances.forEach((balance) => expect(balance).to.equal(voterRifAmount));
    });

    it('voters should not have voting power before delegating it', async () => {
      const voteBalances = await Promise.all(
        [voter1, voter2, voter3].map((voter) => rifVoteToken.getVotes(voter.address)),
      );
      voteBalances.forEach((balance) => expect(balance).to.equal(0));
    });

    it('RIFVote token holders should self-delegate the voting power', async () => {
      const txs = [voter1, voter2, voter3].map((voter) => ({
        voter,
        promise: rifVoteToken.connect(voter).delegate(voter.address),
      }));
      await Promise.all(txs.map((tx) => expect(tx.promise).to.emit(rifVoteToken, 'DelegateChanged').withArgs(
        tx.voter.address,
        hre.ethers.constants.AddressZero,
        tx.voter.address,
      )));
    });

    it('voters should have voting power after the delegation', async () => {
      const voteBalances = await Promise.all(
        [voter1, voter2, voter3].map((voter) => rifVoteToken.getVotes(voter.address)),
      );
      voteBalances.forEach((balance) => expect(balance).to.equal(voterRifAmount));
    });
  });

  describe('Proposal creation', () => {
    const proposalDescription = 'Proposal #1: Give a grant to proposer';

    it('someone without voting power should not be able to create a proposal', async () => {
      const calldata = rifToken.interface.encodeFunctionData('transfer', [
        team.address,
        treasuryRifAmount,
      ]);
      const tx = governor
        .connect(deployer).propose(
          [rifToken.address],
          [0],
          [calldata],
          proposalDescription,
        );
      await expect(tx).to.be.revertedWith('Governor: proposer votes below proposal threshold');
    });

    it('voter 1 should be able to create a proposal', async () => {
      // the proposal is:
      // Lets give all the RIF tokens from the Treasury to the team
      const calldata = rifToken.interface.encodeFunctionData('transfer', [
        team.address,
        treasuryRifAmount,
      ]);
      const tx = await governor
        .connect(voter1).propose(
          [rifToken.address], // which address to send tx to on proposal execution
          [0], // amount of Ether / RBTC to supply
          [calldata], // encoded function call
          proposalDescription,
        );
      const receipt = await tx.wait();
      const { args } = receipt.events.find(
        (e) => e.event === 'ProposalCreated',
      );
      proposalId = args.proposalId;
      expect(args.proposer).to.equal(voter1.address);
      expect(args.description).to.equal(proposalDescription);
    });
  });

  describe('Voting', () => {
    it('voters should not have voted yet', async () => {
      const results = await Promise.all(
        [voter1, voter2, voter3].map((voter) => governor.hasVoted(proposalId, voter.address)),
      );
      results.forEach((hasVoted) => expect(hasVoted).to.be.false);
    });
  });
});
