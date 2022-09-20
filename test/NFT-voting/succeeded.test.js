const { expect } = require('chai');
const hre = require('hardhat');
const { v4: uuidv4 } = require('uuid');
const {
  skipBlocks,
  getSigners,
  ProposalState,
  VoteType,
} = require('../../util');
const { deployNftVoting } = require('../../util/deployments');

describe('Governance - Successful NFT voting', () => {
  // voters
  let voters;
  let votersFor;
  let votersAgainst;
  let votersAbstain;

  // smart contracts
  let voteToken;
  let governor;
  let proposalTarget;

  // proposal
  let proposal;
  let proposalId;
  let proposalDescription;
  let proposalDescriptionHash;
  let newVotingPeriodCalldata;
  let setTargetCalldata;

  const newVotingPeriod = 33;

  before(async () => {
    voters = await getSigners(0, 8);
    votersFor = voters.slice(0, 3);
    votersAbstain = voters.slice(3, 6);
    votersAgainst = voters.slice(6);
    [voteToken, governor, proposalTarget] = await deployNftVoting(voters);
  });

  describe('Delegating voting power for the voters', () => {
    it('each voter should own an NFT', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          expect(await voteToken.balanceOf(voter.address)).to.equal(1);
        }),
      );
    });

    it('voters should not have voting power before delegating it', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          expect(await voteToken.getVotes(voter.address)).to.equal(0);
        }),
      );
    });

    it('RNSVote token holders should self-delegate the voting power', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const tx = await voteToken.connect(voter).delegate(voter.address);
          await tx.wait();
          expect(
            await voteToken.connect(voter).getVotes(voter.address),
          ).to.equal(1);
        }),
      );
    });
  });

  describe('Proposal creation', () => {
    before(async () => {
      proposalDescription = uuidv4(); // always unique id
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
      // get proposal ID before creating a proposal
      proposalId = hre.ethers.BigNumber.from(
        hre.ethers.utils.keccak256(
          hre.ethers.utils.defaultAbiCoder.encode(
            ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
            [...proposal, proposalDescriptionHash],
          ),
        ),
      );
    });

    it('proposal ID should be correct', async () => {
      const governorProposalId = await governor.hashProposal(
        ...proposal,
        proposalDescriptionHash,
      );
      expect(governorProposalId).to.equal(proposalId);
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
      await Promise.all(
        voters.map(async (voter) => {
          expect(
            await governor.connect(voter).hasVoted(proposalId, voter.address),
          ).to.be.false;
        }),
      );
    });

    it('Voters should vote for', async () => {
      await skipBlocks(1);
      const reason = '';
      const votingPower = 1;
      await Promise.all(
        votersFor.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.For))
            .to.emit(governor, 'VoteCast')
            .withArgs(
              voter.address,
              proposalId,
              VoteType.For,
              votingPower,
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
      await Promise.all(
        voters.map(async (voter) => {
          expect(
            await governor.connect(voter).hasVoted(proposalId, voter.address),
          ).to.be.true;
        }),
      );
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
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
      const quorum = await governor.quorum(deadline);
      // 4%
      expect(quorum).to.equal(Math.floor(voters.length / 100) * 4);
    });

    it('Proposal should be succeeded', async () => {
      expect(await governor.state(proposalId)).to.equal(
        ProposalState.Succeeded,
      );
    });
  });

  describe('Proposal execution', () => {
    it('should execute the proposal and call its target contract', async () => {
      const tx = governor.execute(...proposal, proposalDescriptionHash);
      await expect(tx)
        .to.emit(proposalTarget, 'ProposalProcessed')
        .withArgs(proposalId);
    });

    it('address of the proposal target should be set on the governor', async () => {
      expect(await governor.proposalTarget()).to.equal(
        hre.ethers.utils.getAddress(proposalTarget.address),
      );
    });

    it('voting period should be updated on the governor', async () => {
      expect(await governor.votingPeriod()).to.equal(newVotingPeriod);
    });
  });
});
