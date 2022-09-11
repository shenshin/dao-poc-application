const { expect } = require('chai');
const hre = require('hardhat');
const { deployContract, skipBlocks } = require('../../util');

describe('Governance - Succeeded Fungible tokens quadratic voting', () => {
  let deployer;
  let team;
  let voters;
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

  const totalSupply = 10301;
  const treasuryRifAmount = 200;

  const VoteType = {
    Against: 0,
    For: 1,
    Abstain: 2,
  };

  const ProposalState = {
    Pending: 0,
    Active: 1,
    Canceled: 2,
    Defeated: 3,
    Succeeded: 4,
    Queued: 5,
    Expired: 6,
    Executed: 7,
  };

  const votersBalances = [1, 100, 10000];

  before(async () => {
    const signers = await hre.ethers.getSigners();
    [deployer, team] = signers;
    voters = signers.slice(2, 5);
    // associating different voting power with each voter
    votersBalances.forEach((amount, i) => {
      voters[i].rifAmount = amount;
    });
    rifVoteToken = await deployContract('QuadraticVoteToken', totalSupply);
    governor = await deployContract(
      'GovernorFtQuadratic',
      rifVoteToken.address,
    );
    proposalTarget = await deployContract('ProposalTarget', governor.address);
  });

  describe('RIFVote upon depoyment', () => {
    it('RIF total supply should be minted', async () => {
      expect(await rifVoteToken.totalSupply()).to.equal(totalSupply);
    });

    it('should transfer tokens to voters and treasury', async () => {
      const wallets = [...voters];
      async function transferRifs() {
        const voter = wallets.pop();
        if (voter) {
          await expect(rifVoteToken.transfer(voter.address, voter.rifAmount))
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(deployer.address, voter.address, voter.rifAmount);
          await transferRifs();
        }
      }
      await transferRifs();
      await expect(rifVoteToken.transfer(governor.address, treasuryRifAmount))
        .to.emit(rifVoteToken, 'Transfer')
        .withArgs(deployer.address, governor.address, treasuryRifAmount);
    });

    it('voters should delegate voting power', async () => {
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
      proposalCalldata = rifVoteToken.interface.encodeFunctionData('transfer', [
        team.address,
        treasuryRifAmount,
      ]);
      // encoding the setting of proposal target reference on the governor
      setTargetCalldata = governor.interface.encodeFunctionData(
        'updateProposalTarget',
        [proposalTarget.address],
      );
      proposal = [
        [rifVoteToken.address, governor.address],
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

    it('Voter 1 should vote for', async () => {
      await skipBlocks(1);
      const reason = '';
      const tx = governor.connect(voters[0]).castVote(proposalId, VoteType.For);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[0].address,
          proposalId,
          VoteType.For,
          voters[0].rifAmount,
          reason,
        );
    });
    it('Voter 2 should vote against', async () => {
      const reason = '';
      const tx = governor
        .connect(voters[1])
        .castVote(proposalId, VoteType.Against);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[1].address,
          proposalId,
          VoteType.Against,
          voters[1].rifAmount,
          reason,
        );
    });
    it('Voter 3 should vote for', async () => {
      const reason = '';
      const tx = governor.connect(voters[2]).castVote(proposalId, VoteType.For);
      await expect(tx)
        .to.emit(governor, 'VoteCast')
        .withArgs(
          voters[2].address,
          proposalId,
          VoteType.For,
          voters[2].rifAmount,
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

  describe('Voting results', () => {
    it('total votes should equal voters rif amount square root sum', async () => {
      const proposalVotes = await governor.proposalVotes(proposalId);
      expect(proposalVotes.againstVotes).to.equal(10);
      expect(proposalVotes.forVotes).to.equal(1 + 100);
    });

    it('should calculate the quorum correctly', async () => {
      const quorum = await governor.quorum(
        (await hre.ethers.provider.getBlockNumber()) - 1,
      );
      expect(quorum).to.equal(Math.floor(Math.sqrt(totalSupply)));
    });

    it('Proposal should be succeeded', async () => {
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
      expect(await governor.state(proposalId)).to.equal(
        ProposalState.Succeeded,
      );
    });
  });

  describe('Proposal execution', () => {
    it('should execute the Proposal and call its target contract', async () => {
      const tx = governor.execute(...proposal, proposalDescriptionHash);
      await expect(tx)
        .to.emit(proposalTarget, 'ProposalProcessed')
        .withArgs(proposalId);
    });

    it("governor's RIF treasury tokens should be transferred to the team", async () => {
      expect(await rifVoteToken.balanceOf(team.address)).to.equal(
        treasuryRifAmount,
      );
      expect(await rifVoteToken.balanceOf(governor.address)).to.equal(0);
    });

    it('address of the proposal target should be set on the governor', async () => {
      expect(await governor.proposalTarget()).to.equal(proposalTarget.address);
    });
  });
});
