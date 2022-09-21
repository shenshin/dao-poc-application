const { expect } = require('chai');
const hre = require('hardhat');
const { v4: uuidv4 } = require('uuid');
const {
  skipBlocks,
  getSigners,
  sqrtBN,
  ProposalState,
  VoteType,
} = require('../../util');
const { deployFtQuadratic } = require('../../util/deployments');

describe('Governance - Defeated Fungible tokens quadratic voting', () => {
  let voters;
  // contracts
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

  // initial governor's parameters should not be changed after
  // proposal execution
  let initPropTargAddrOnGovernor;
  let initVotingPeriod;

  const newVotingPeriod = 44;

  before(async () => {
    const signers = await getSigners(0, 4);
    // skip deployer because he doesn't vote
    voters = signers.slice(1);
    [rifVoteToken, governor, proposalTarget] = await deployFtQuadratic(signers);
    initPropTargAddrOnGovernor = await governor.proposalTarget();
    initVotingPeriod = await governor.votingPeriod();
    // store token balances
    await Promise.all(
      voters.map(async (voter, i) => {
        const balance = await rifVoteToken.balanceOf(voter.address);
        voters[i].balance = balance;
      }),
    );
  });

  describe('RIFVote upon deployment', () => {
    it('voters should delegate voting power', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const tx = await rifVoteToken.connect(voter).delegate(voter.address);
          await tx.wait();
          expect(
            await rifVoteToken.connect(voter).getVotes(voter.address),
          ).to.equal(voter.balance);
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

    it('voter 1 should be able to create a proposal', async () => {
      await skipBlocks(1);
      const tx = await governor
        .connect(voters[1])
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
          const result = await governor.hasVoted(proposalId, voter.address);
          expect(result).to.be.false;
        }),
      );
    });

    it('Voter 0 should vote FOR', async () => {
      await skipBlocks(1);
      const tx = governor.connect(voters[0]).castVote(proposalId, VoteType.For);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[0].address,
          proposalId,
          VoteType.For,
          voters[0].balance,
          '',
        );
    });
    it('Voter 1 should vote ABSTAIN', async () => {
      const tx = governor
        .connect(voters[1])
        .castVote(proposalId, VoteType.Abstain);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[1].address,
          proposalId,
          VoteType.Abstain,
          voters[1].balance,
          '',
        );
    });
    it('Voter 2 should vote AGAINST', async () => {
      const tx = governor
        .connect(voters[2])
        .castVote(proposalId, VoteType.Against);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[2].address,
          proposalId,
          VoteType.Against,
          voters[2].balance,
          '',
        );
    });
    it('voters should have finished voting', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const result = await governor.hasVoted(proposalId, voter.address);
          expect(result).to.be.true;
        }),
      );
    });
  });

  describe('Voting results', () => {
    it('total votes should equal voters rif amount square root sum', async () => {
      const proposalVotes = await governor.proposalVotes(proposalId);
      expect(proposalVotes.forVotes).to.equal(sqrtBN(voters[0].balance));
      expect(proposalVotes.abstainVotes).to.equal(sqrtBN(voters[1].balance));
      expect(proposalVotes.againstVotes).to.equal(sqrtBN(voters[2].balance));
    });

    it('should calculate the quorum correctly', async () => {
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);

      const totalVotes = voters.reduce(
        (p, voter) => p.add(voter.balance),
        hre.ethers.BigNumber.from('0'),
      );
      expect(await governor.quorum(deadline)).to.equal(sqrtBN(totalVotes));
    });

    it('Proposal should be defeated', async () => {
      expect(await governor.state(proposalId)).to.equal(ProposalState.Defeated);
    });
  });

  describe('Proposal execution', () => {
    it('should not be able to execute the defeated Proposal', async () => {
      const tx = governor.execute(...proposal, proposalDescriptionHash);
      await expect(tx).to.be.revertedWith('Governor: proposal not successful');
    });

    it('address of the proposal target should remain zero on the governor', async () => {
      expect(await governor.proposalTarget()).to.equal(
        initPropTargAddrOnGovernor,
      );
    });

    it('voting period should remain the same', async () => {
      expect(await governor.votingPeriod()).to.equal(initVotingPeriod);
    });
  });
});
