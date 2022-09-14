const { expect } = require('chai');
const hre = require('hardhat');
const { deployContract, skipBlocks } = require('../../util');
const { ProposalState, VoteType } = require('../constants.js');

describe('Governance - Successfull Fungible tokens voting', () => {
  let deployer;
  let voters;
  let team;
  let rifToken;
  let rifVoteToken;
  let governor;
  let proposalTarget;
  // proposal
  let proposal;
  let proposalId;
  let proposalCalldata;
  let proposalDescription;
  let proposalDescriptionHash;
  let setTargetCalldata;

  const totalRifSupply = 1000;
  const voterRifAmount = 100;
  const treasuryRifAmount = 700;

  before(async () => {
    const signers = await hre.ethers.getSigners();
    [deployer, team] = signers;
    voters = signers.slice(2, 5);
    rifToken = await deployContract('RIFToken', totalRifSupply);
    rifVoteToken = await deployContract('RIFVoteToken', rifToken.address);
    governor = await deployContract('GovernorFT', rifVoteToken.address);
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
      await Promise.all(
        voters.map((voter) =>
          expect(
            rifToken
              .connect(voter)
              .approve(rifVoteToken.address, voterRifAmount),
          )
            .to.emit(rifToken, 'Approval')
            .withArgs(voter.address, rifVoteToken.address, voterRifAmount),
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
      await Promise.all(
        voters.map((voter) =>
          expect(
            rifVoteToken
              .connect(voter)
              .depositFor(voter.address, voterRifAmount),
          )
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(
              hre.ethers.constants.AddressZero,
              voter.address,
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
      await Promise.all(
        voters.map((voter) =>
          expect(rifVoteToken.connect(voter).delegate(voter.address))
            .to.emit(rifVoteToken, 'DelegateChanged')
            .withArgs(
              voter.address,
              hre.ethers.constants.AddressZero,
              voter.address,
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
      proposalDescriptionHash = hre.ethers.utils.solidityKeccak256(
        ['string'],
        [proposalDescription],
      );
      // encoding RIF token `transfer` function call
      proposalCalldata = rifToken.interface.encodeFunctionData('transfer', [
        team.address,
        treasuryRifAmount,
      ]);
      // encoding the setting of proposal target reference on the governor
      setTargetCalldata = governor.interface.encodeFunctionData(
        'updateProposalTarget',
        [proposalTarget.address],
      );
      proposal = [
        [rifToken.address, governor.address],
        [0, 0],
        [proposalCalldata, setTargetCalldata],
      ];
      // get proposal ID before creating the proposal
      proposalId = await governor.hashProposal(
        ...proposal,
        proposalDescriptionHash,
      );
    });

    it('voter 1 should be able to create a proposal', async () => {
      await skipBlocks(1);
      const tx = await governor
        .connect(voters[0])
        .propose(...proposal, proposalDescription);
      const receipt = await tx.wait();
      const { args } = receipt.events.find(
        (e) => e.event === 'ProposalCreated',
      );
      expect(args.proposalId).to.equal(proposalId);
    });
  });

  describe('Voting', () => {
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
    it('voters should have finished voting', async () => {
      const results = await Promise.all(
        voters.map((voter) => governor.hasVoted(proposalId, voter.address)),
      );
      results.forEach((hasVoted) => expect(hasVoted).to.be.true);
    });
  });

  describe('Proposal execution', () => {
    it('Proposal should be succeeded', async () => {
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
      expect(await governor.state(proposalId)).to.equal(
        ProposalState.Succeeded,
      );
    });

    it('should execute the Proposal and call its target contract', async () => {
      const tx = governor.execute(...proposal, proposalDescriptionHash);
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

    it('address of the proposal target should be set on the governor', async () => {
      expect(await governor.proposalTarget()).to.equal(proposalTarget.address);
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
      await Promise.all(
        voters.map((voter) =>
          expect(
            rifVoteToken
              .connect(voter)
              .withdrawTo(voter.address, voterRifAmount),
          )
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(
              voter.address,
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
});
