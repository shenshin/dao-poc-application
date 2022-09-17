const { expect } = require('chai');
const hre = require('hardhat');
const { deployContract, skipBlocks, getSigners } = require('../../util');
const { ProposalState, VoteType } = require('../constants.js');
const rifTokenAbi = require('../../abi/rifToken.json');

describe('Governance - Successfull Fungible tokens voting', () => {
  // voters
  let deployer;
  let voters;
  let votersAgainst;
  let votersFor;
  let votersAbstain;

  // smart contracts
  let rifToken;
  let rifVoteToken;
  let governor;
  let proposalTarget;

  // proposal
  let proposal;
  let proposalId;
  let proposalDescription;
  let proposalDescriptionHash;
  let newVotingPeriodCalldata;
  let setTargetCalldata;

  const voterRifAmount = 100;
  const newVotingPeriod = 33;

  before(async () => {
    const signers = await getSigners(0, 8);
    [deployer] = signers;
    voters = signers.slice(2, 5);

    [rifToken, rifVoteToken, governor, proposalTarget] = await hre.run(
      'deploy',
    );
  });

  describe('RIF / RIFVote upon depoyment', () => {
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
      // encoding the setting of a new voting period on the governor
      newVotingPeriodCalldata = governor.interface.encodeFunctionData(
        'setVotingPeriod',
        [newVotingPeriod],
      );
      // encoding the setting of proposal target reference on the governor
      setTargetCalldata = governor.interface.encodeFunctionData(
        'updateProposalTarget',
        [proposalTarget.address],
      );
      proposal = [
        [governor.address, governor.address],
        [0, 0],
        [newVotingPeriodCalldata, setTargetCalldata],
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
    it('Proposal should be successfull', async () => {
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

    it('address of the proposal target should be set on the governor', async () => {
      expect(await governor.proposalTarget()).to.equal(proposalTarget.address);
    });

    it('voting period should be updated on the governor', async () => {
      expect(await governor.votingPeriod()).to.equal(newVotingPeriod);
    });
  });

  describe('Unwrap RIF tokens', () => {
    it('voters RIF balances should be zero, since they exchanged their RIFs to RIFVotes', async () => {
      const balances = await Promise.all(
        voters.map((voter) => rifToken.balanceOf(voter.address)),
      );
      balances.forEach((balance) => expect(balance).to.equal(0));
    });

    it('should unwrap voting tokens to obtain regular tokens', async () => {
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
