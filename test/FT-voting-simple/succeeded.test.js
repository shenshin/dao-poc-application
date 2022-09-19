const { expect } = require('chai');
const hre = require('hardhat');
const { v4: uuidv4 } = require('uuid');
const { skipBlocks, getSigners, deployFtSimple } = require('../../util');
const { ProposalState, VoteType } = require('../../util/constants.js');

describe('Governance - Successfull Fungible tokens voting', () => {
  // voters
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

  const votingPower = hre.ethers.BigNumber.from('100000000000000000000'); // 10 RIFs
  const newVotingPeriod = 33; // blocks

  before(async () => {
    voters = await getSigners(0, 8); // 8 voters
    [rifToken, rifVoteToken, governor, proposalTarget] = await deployFtSimple(
      voters,
    );
    votersAgainst = voters.slice(0, 2); // 20 votes Against
    votersFor = voters.slice(2, 5); // 30 votes For
    votersAbstain = voters.slice(5, 8); // 3 votes Abstain
  });

  describe('RIF / RIFVote upon depoyment', () => {
    it('each voter should have at least 10 RIFs', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const rifBalance = await rifToken.balanceOf(voter.address);
          expect(rifBalance.gte(votingPower)).to.be.true;
        }),
      );
    });

    it('RIFVote decimals should equal RIF decimals', async () => {
      expect(await rifVoteToken.decimals()).to.equal(await rifToken.decimals());
    });
  });

  describe('Wrapping RIF with RIFVote tokens. Votes delegation', () => {
    it('voters should approve the RIF allowance for RIFVote', async () => {
      await Promise.all(
        voters.map((voter) =>
          expect(
            rifToken.connect(voter).approve(rifVoteToken.address, votingPower),
          )
            .to.emit(rifToken, 'Approval')
            .withArgs(
              voter.address,
              hre.ethers.utils.getAddress(rifVoteToken.address),
              votingPower,
            ),
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
        expect(allowance).to.equal(votingPower),
      );
    });

    it('voters should deposit underlying tokens and mint the corresponding number of wrapped tokens', async () => {
      await Promise.all(
        voters.map((voter) =>
          expect(
            rifVoteToken.connect(voter).depositFor(voter.address, votingPower),
          )
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(
              hre.ethers.constants.AddressZero,
              voter.address,
              votingPower,
            ),
        ),
      );
    });

    it('voters should now own the RIFVote tokens', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const balance = await rifVoteToken
            .connect(voter)
            .balanceOf(voter.address);
          expect(balance).to.equal(votingPower);
        }),
      );
    });

    it('RIFVote token holders should self-delegate the voting power', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const tx = await rifVoteToken.connect(voter).delegate(voter.address);
          await tx.wait();
          expect(
            await rifVoteToken.connect(voter).getVotes(voter.address),
          ).to.equal(votingPower);
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
      // get proposal ID before creating the proposal
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

    it('voter 0 should be able to create a proposal', async () => {
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
    it('voting for proposal should be active', async () => {
      await skipBlocks(1);
      expect(await governor.state(proposalId)).to.equal(ProposalState.Active);
    });

    it('voters should not have voted yet', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const hasVoted = await governor
            .connect(voter)
            .hasVoted(proposalId, voter.address);
          expect(hasVoted).to.be.false;
        }),
      );
    });

    it('should vote for', async () => {
      await Promise.all(
        votersFor.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.For))
            .to.emit(governor, 'VoteCast')
            .withArgs(voter.address, proposalId, VoteType.For, votingPower, ''),
        ),
      );
    });

    it('should vote against', async () => {
      await Promise.all(
        votersAgainst.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.Against))
            .to.emit(governor, 'VoteCast')
            .withArgs(
              voter.address,
              proposalId,
              VoteType.Against,
              votingPower,
              '',
            ),
        ),
      );
    });

    it('should vote abstain', async () => {
      await Promise.all(
        votersAbstain.map((voter) =>
          expect(governor.connect(voter).castVote(proposalId, VoteType.Abstain))
            .to.emit(governor, 'VoteCast')
            .withArgs(
              voter.address,
              proposalId,
              VoteType.Abstain,
              votingPower,
              '',
            ),
        ),
      );
    });

    it('voters should have finished voting', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const hasVoted = await governor
            .connect(voter)
            .hasVoted(proposalId, voter.address);
          expect(hasVoted).to.be.true;
        }),
      );
    });

    it('governore should store the given votes', async () => {
      const proposalVotes = await governor.proposalVotes(proposalId);
      expect(proposalVotes.againstVotes).to.equal(
        hre.ethers.BigNumber.from(votingPower).mul(votersAgainst.length),
      );
      expect(proposalVotes.forVotes).to.equal(
        hre.ethers.BigNumber.from(votingPower).mul(votersFor.length),
      );
      expect(proposalVotes.abstainVotes).to.equal(
        hre.ethers.BigNumber.from(votingPower).mul(votersAbstain.length),
      );
    });
  });

  describe('Proposal execution', () => {
    it('Quorum should be reached', async () => {
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
      // 4% from total votes
      const quorum = votingPower.mul(voters.length).div(100).mul(4);
      expect(await governor.quorum(deadline)).to.equal(quorum);
    });

    it('Proposal should be successfull', async () => {
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
      expect(await governor.proposalTarget()).to.equal(
        hre.ethers.utils.getAddress(proposalTarget.address),
      );
    });

    it('voting period should be updated on the governor', async () => {
      expect(await governor.votingPeriod()).to.equal(newVotingPeriod);
    });
  });

  describe('Unwrapping RIF tokens', () => {
    it('should unwrap voting tokens to obtain RIF tokens', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const rifBalance = await rifToken.balanceOf(voter.address);
          const withdrawTx = await rifVoteToken
            .connect(voter)
            .withdrawTo(voter.address, votingPower);
          await withdrawTx.wait();
          expect(await rifToken.balanceOf(voter.address)).to.equal(
            rifBalance.add(votingPower),
          );
        }),
      );
    });
  });
});
