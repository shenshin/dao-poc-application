const { expect } = require('chai');
const hre = require('hardhat');
const { deployContract, skipBlocks, getSigners } = require('../../util');
const { ProposalState, VoteType } = require('../constants.js');

describe('Governance - Defeated NFT voting', () => {
  let voters;
  let votersFor;
  let votersAgainst;
  let votersAbstain;
  let rnsVoteToken;
  let governor;
  let proposalTarget;
  // proposal
  let proposal;
  let proposalId;
  let proposalDescription;
  let proposalDescriptionHash;
  let newVotingPeriodCalldata;
  let setTargetCalldata;

  const currentVotingPeriod = 18; // blocks
  const newVotingPeriod = 33;

  before(async () => {
    voters = getSigners(8);
    votersFor = voters.slice(0, 2);
    votersAbstain = voters.slice(2, 5);
    votersAgainst = voters.slice(5);
    rnsVoteToken = await deployContract('RNSVote');
    governor = await deployContract('GovernorNFT', rnsVoteToken.address);
    proposalTarget = await deployContract('ProposalTarget', governor.address);
  });

  describe('Delegating voting power for the voters', () => {
    it('should mint an NFT for each voter', async () => {
      await (
        await rnsVoteToken.safeMintBunch(voters.map((voter) => voter.address))
      ).wait();
      const balances = await Promise.all(
        voters.map((voter) => rnsVoteToken.balanceOf(voter.address)),
      );
      balances.forEach((balance) => expect(balance).to.equal(1));
    });

    it('voters should not have voting power before delegating it', async () => {
      const voteBalances = await Promise.all(
        voters.map((voter) => rnsVoteToken.getVotes(voter.address)),
      );
      voteBalances.forEach((balance) => expect(balance).to.equal(0));
    });

    it('RNSVote token holders should self-delegate the voting power', async () => {
      await Promise.all(
        voters.map((voter) =>
          expect(rnsVoteToken.connect(voter).delegate(voter.address))
            .to.emit(rnsVoteToken, 'DelegateChanged')
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
        voters.map((voter) => rnsVoteToken.getVotes(voter.address)),
      );
      voteBalances.forEach((balance) => expect(balance).to.equal(1));
    });
  });

  describe('Proposal creation', () => {
    before(async () => {
      proposalDescription = 'Change the voting period and set proposal target';
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

    it('Voters should vote for', async () => {
      await skipBlocks(1);
      const reason = '';
      const votePower = 1;
      await Promise.all(
        votersFor.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.For))
            .to.emit(governor, 'VoteCast')
            .withArgs(
              voter.address,
              proposalId,
              VoteType.For,
              votePower,
              reason,
            ),
        ),
      );
    });

    it('Voters should vote abstain', async () => {
      const reason = '';
      const votePower = 1;
      await Promise.all(
        votersAbstain.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.Abstain))
            .to.emit(governor, 'VoteCast')
            .withArgs(
              voter.address,
              proposalId,
              VoteType.Abstain,
              votePower,
              reason,
            ),
        ),
      );
    });

    it('Voters should vote against', async () => {
      const reason = '';
      const votePower = 1;
      await Promise.all(
        votersAgainst.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.Against))
            .to.emit(governor, 'VoteCast')
            .withArgs(
              voter.address,
              proposalId,
              VoteType.Against,
              votePower,
              reason,
            ),
        ),
      );
    });

    it('voters should have finished voting', async () => {
      const results = await Promise.all(
        voters.map((voter) => governor.hasVoted(proposalId, voter.address)),
      );
      results.forEach((hasVoted) => expect(hasVoted).to.be.true);
    });
  });

  describe('Voting results', () => {
    it('it should store the given votes', async () => {
      const proposalVotes = await governor.proposalVotes(proposalId);
      expect(proposalVotes.againstVotes).to.equal(votersAgainst.length);
      expect(proposalVotes.forVotes).to.equal(votersFor.length);
      expect(proposalVotes.abstainVotes).to.equal(votersAbstain.length);
    });

    it('should calculate the quorum correctly', async () => {
      const quorum = await governor.quorum(
        (await hre.ethers.provider.getBlockNumber()) - 1,
      );
      // 4%
      expect(quorum).to.equal(Math.floor(voters.length / 100) * 4);
    });

    it('Proposal should be defeated', async () => {
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
      expect(await governor.state(proposalId)).to.equal(ProposalState.Defeated);
    });
  });

  describe('Proposal execution', () => {
    it('should not be able to execute the defeated Proposal', async () => {
      const tx = governor.execute(...proposal, proposalDescriptionHash);
      await expect(tx).to.be.revertedWith('Governor: proposal not successful');
    });

    it('voting period should not be updated on the governor', async () => {
      expect(await governor.votingPeriod()).to.equal(currentVotingPeriod);
    });
  });
});
