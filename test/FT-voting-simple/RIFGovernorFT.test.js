const { expect } = require('chai');
const hre = require('hardhat');
const { deployContract, skipBlocks } = require('../../util');

describe('Governance - Fungible tokens voting', () => {
  let deployer;
  let voters;
  let team;
  let rifToken;
  let rifVoteToken;
  let governor;
  let proposalTarget;
  // proposal
  let proposalId;
  let proposalCalldata;
  let proposalDescription;
  let proposalDescriptionHash;
  let setTargetCalldata;

  const totalRifSupply = hre.ethers.BigNumber.from(1000);
  const voterRifAmount = hre.ethers.BigNumber.from(100);
  const treasuryRifAmount = hre.ethers.BigNumber.from(700);

  before(async () => {
    const signers = await hre.ethers.getSigners();
    [deployer, team] = signers;
    voters = signers.slice(2, 5);
    rifToken = await deployContract('RIFToken', totalRifSupply);
    rifVoteToken = await deployContract('RIFVoteToken', rifToken.address);
    governor = await deployContract('RIFGovernorFT', rifVoteToken.address);
    proposalTarget = await deployContract('ProposalTarget', governor.address);
  });

  describe('RIF / RIFVote upon depoyment', () => {
    it('RIF total supply should be minted', async () => {
      expect(await rifToken.totalSupply()).to.equal(totalRifSupply);
    });

    it('RIFVote decimals should equal RIF decimals', async () => {
      expect(await rifVoteToken.decimals()).to.equal(await rifToken.decimals());
    });

    it('The deployer should transfer all RIF tokens to the Voters equally', async () => {
      const wallets = [...voters];
      async function transferRifs() {
        const voter = wallets.pop();
        if (voter) {
          await expect(rifToken.transfer(voter.address, voterRifAmount))
            .to.emit(rifToken, 'Transfer')
            .withArgs(deployer.address, voter.address, voterRifAmount);
          await transferRifs();
        }
      }
      await transferRifs();
    });

    it('The deployer should transfer the rest of RIF tokens to the Governance Treasury', async () => {
      const tx = rifToken.transfer(governor.address, treasuryRifAmount);
      await expect(tx)
        .to.emit(rifToken, 'Transfer')
        .withArgs(deployer.address, governor.address, treasuryRifAmount);
    });
  });

  describe('Wrapping RIF with RIFVote tokens. Votes delegation', () => {
    it('voters should approve the RIF allowance for RIFVote', async () => {
      const txs = voters.map((voter) => ({
        voter,
        promise: rifToken
          .connect(voter)
          .approve(rifVoteToken.address, voterRifAmount),
      }));
      await Promise.all(
        txs.map((tx) =>
          expect(tx.promise)
            .to.emit(rifToken, 'Approval')
            .withArgs(tx.voter.address, rifVoteToken.address, voterRifAmount),
        ),
      );
    });

    it('each voter allowance for RIFVote should be set on the RIF token', async () => {
      const allowances = await Promise.all(
        voters.map((voter) =>
          rifToken.allowance(voter.address, rifVoteToken.address),
        ),
      );
      allowances.forEach((allowance) =>
        expect(allowance).to.equal(voterRifAmount),
      );
    });

    it('voters should deposit underlying tokens and mint the corresponding number of wrapped tokens', async () => {
      const txs = voters.map((voter) => ({
        voter,
        promise: rifVoteToken
          .connect(voter)
          .depositFor(voter.address, voterRifAmount),
      }));
      await Promise.all(
        txs.map((tx) =>
          expect(tx.promise)
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(
              hre.ethers.constants.AddressZero,
              tx.voter.address,
              voterRifAmount,
            ),
        ),
      );
    });

    it('voters should now own the RIFVote tokens', async () => {
      const balances = await Promise.all(
        voters.map((voter) => rifVoteToken.balanceOf(voter.address)),
      );
      balances.forEach((balance) => expect(balance).to.equal(voterRifAmount));
    });

    it('voters should not have voting power before delegating it', async () => {
      const voteBalances = await Promise.all(
        voters.map((voter) => rifVoteToken.getVotes(voter.address)),
      );
      voteBalances.forEach((balance) => expect(balance).to.equal(0));
    });

    it('RIFVote token holders should self-delegate the voting power', async () => {
      const txs = voters.map((voter) => ({
        voter,
        promise: rifVoteToken.connect(voter).delegate(voter.address),
      }));
      await Promise.all(
        txs.map((tx) =>
          expect(tx.promise)
            .to.emit(rifVoteToken, 'DelegateChanged')
            .withArgs(
              tx.voter.address,
              hre.ethers.constants.AddressZero,
              tx.voter.address,
            ),
        ),
      );
    });

    it('voters should have voting power after the delegation', async () => {
      const voteBalances = await Promise.all(
        voters.map((voter) => rifVoteToken.getVotes(voter.address)),
      );
      voteBalances.forEach((balance) =>
        expect(balance).to.equal(voterRifAmount),
      );
    });
  });

  describe('Proposal creation', () => {
    before(async () => {
      // The Proposal is as follows:
      // Let's give all the RIF tokens from the Treasury to the team

      proposalDescription = 'Proposal #1: Give a grant to proposer';
      // calculating keccak256 hash of th proposal description
      proposalDescriptionHash = hre.ethers.utils.keccak256(
        hre.ethers.utils.toUtf8Bytes(proposalDescription),
      );
      // encoding RIF token `transfer` function call
      proposalCalldata = rifToken.interface.encodeFunctionData('transfer', [
        team.address,
        treasuryRifAmount,
      ]);
      const iface = new hre.ethers.utils.Interface([
        'function updateProposalTarget(address _newTarget)',
      ]);
      setTargetCalldata = iface.encodeFunctionData('updateProposalTarget', [
        proposalTarget.address,
      ]);
      // get proposal ID before creating the proposal
      proposalId = await governor.hashProposal(
        [rifToken.address, governor.address],
        [0, 0],
        [proposalCalldata, setTargetCalldata],
        proposalDescriptionHash,
      );
    });

    it.skip('someone without voting power should not be able to create a proposal', async () => {
      const tx = governor
        .connect(deployer)
        .propose(
          [rifToken.address, governor.address],
          [0, 0],
          [proposalCalldata, setTargetCalldata],
          proposalDescription,
        );
      await expect(tx).to.be.revertedWith(
        'proposer votes below proposal threshold',
      );
    });

    it('voter 1 should be able to create a proposal', async () => {
      await skipBlocks(1);
      const tx = await governor.connect(voters[0]).propose(
        [rifToken.address, governor.address], // which address to send tx to on proposal execution
        [0, 0], // amount of Ether / RBTC to supply
        [proposalCalldata, setTargetCalldata], // encoded function call
        proposalDescription,
      );
      const receipt = await tx.wait();
      const { args } = receipt.events.find(
        (e) => e.event === 'ProposalCreated',
      );
      expect(args.proposalId).to.equal(proposalId);
    });
  });

  describe('Voting', () => {
    const VoteType = {
      Against: 0,
      For: 1,
      Abstain: 2,
    };
    it('voters should not have voted yet', async () => {
      const results = await Promise.all(
        voters.map((voter) => governor.hasVoted(proposalId, voter.address)),
      );
      results.forEach((hasVoted) => expect(hasVoted).to.be.false);
    });

    it('Voter 1 should vote FOR', async () => {
      await skipBlocks(1);
      const reason = '';
      const tx = governor.connect(voters[0]).castVote(proposalId, VoteType.For);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[0].address,
          proposalId,
          VoteType.For,
          voterRifAmount,
          reason,
        );
    });
    it('Voter 2 should vote FOR', async () => {
      const reason = '';
      const tx = governor.connect(voters[1]).castVote(proposalId, VoteType.For);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[1].address,
          proposalId,
          VoteType.For,
          voterRifAmount,
          reason,
        );
    });
    it('Voter 3 should vote AGAINST', async () => {
      const reason = '';
      const tx = governor
        .connect(voters[2])
        .castVote(proposalId, VoteType.Against);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[2].address,
          proposalId,
          VoteType.Against,
          voterRifAmount,
          reason,
        );
    });
  });

  describe('Proposal execution', () => {
    it('quorum should be reached', async () => {
      expect(await governor.quorumReached(proposalId)).to.be.true;
    });

    it('voting should be successfull', async () => {
      expect(await governor.voteSucceeded(proposalId)).to.be.true;
    });

    it('should execute the Proposal and call its target contract', async () => {
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
      const tx = governor.execute(
        [rifToken.address, governor.address],
        [0, 0],
        [proposalCalldata, setTargetCalldata],
        proposalDescriptionHash,
      );
      await expect(tx)
        .to.emit(proposalTarget, 'ProposalProcessed')
        .withArgs(proposalId);
    });

    it("governor's RIF treasury tokens should be transferred to the team", async () => {
      expect(await rifToken.balanceOf(team.address)).to.equal(
        treasuryRifAmount,
      );
      expect(await rifToken.balanceOf(governor.address)).to.equal(0);
    });
  });

  describe('Unwrap RIF tokens', () => {
    it('voters RIF balances should be zero, since they exchanged their RIFs to RIFVotes', async () => {
      const balances = await Promise.all(
        voters.map((voter) => rifToken.balanceOf(voter.address)),
      );
      balances.forEach((balance) => expect(balance).to.equal(0));
    });

    it('should unwrap governance tokens to obtain regular tokens', async () => {
      const txs = voters.map((voter) => ({
        voter,
        promise: rifVoteToken
          .connect(voter)
          .withdrawTo(voter.address, voterRifAmount),
      }));
      await Promise.all(
        txs.map((tx) =>
          expect(tx.promise)
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(
              tx.voter.address,
              hre.ethers.constants.AddressZero,
              voterRifAmount,
            ),
        ),
      );
    });

    it('voters should return their RIF tokens', async () => {
      const balances = await Promise.all(
        voters.map((voter) => rifToken.balanceOf(voter.address)),
      );
      balances.forEach((balance) => expect(balance).to.equal(voterRifAmount));
    });
  });

  describe('Calling proposal target smart contract', () => {
    it(`target should be only called by the governor`, async () => {
      await expect(
        proposalTarget.onProposalExecution(proposalId),
      ).to.be.revertedWith('can be called only by the governor');
    });
  });
});
