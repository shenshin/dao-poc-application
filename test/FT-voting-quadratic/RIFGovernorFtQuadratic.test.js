const { expect } = require('chai');
const hre = require('hardhat');
const { deployContract, skipBlocks } = require('../../util');

describe('Governance - Fungible tokens voting', () => {
  let deployer;
  let team;
  let voters;
  let rifVoteToken;
  let governor;
  let proposalTarget;
  // proposal
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

  before(async () => {
    const signers = await hre.ethers.getSigners();
    [deployer, team] = signers;
    voters = signers.slice(2, 5);
    // associating different voting power with each voter
    [1, 100, 10000].forEach((amount, i) => {
      voters[i].rifAmount = amount;
    });
    rifVoteToken = await deployContract('RIFVoteQuadraticToken', totalSupply);
    governor = await deployContract(
      'RIFGovernorFtQuadratic',
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
        proposalCalldata = rifVoteToken.interface.encodeFunctionData(
          'transfer',
          [team.address, treasuryRifAmount],
        );
        // encoding the setting of proposal target reference on the governor
        setTargetCalldata = governor.interface.encodeFunctionData(
          'updateProposalTarget',
          [proposalTarget.address],
        );
        // get proposal ID before creating the proposal
        proposalId = await governor.hashProposal(
          [rifVoteToken.address, governor.address],
          [0, 0],
          [proposalCalldata, setTargetCalldata],
          proposalDescriptionHash,
        );
      });

      it('voter 1 should be able to create a proposal', async () => {
        await skipBlocks(1);
        const tx = await governor.connect(voters[0]).propose(
          [rifVoteToken.address, governor.address], // which address to send tx to on proposal execution
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
      it('voters should not have voted yet', async () => {
        const results = await Promise.all(
          voters.map((voter) => governor.hasVoted(proposalId, voter.address)),
        );
        results.forEach((hasVoted) => expect(hasVoted).to.be.false);
      });

      it('Voter 1 should vote for', async () => {
        await skipBlocks(1);
        const reason = '';
        const tx = governor
          .connect(voters[0])
          .castVote(proposalId, VoteType.For);
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
        const tx = governor
          .connect(voters[2])
          .castVote(proposalId, VoteType.For);
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
    });

    describe('Voting results', () => {
      it('total votes should equal voters rif amount square root sum', async () => {
        const againstVotes = await governor.getAgainstVotes(proposalId);
        expect(againstVotes).to.equal(Math.sqrt(voters[1].rifAmount));
        const forVotes = await governor.getForVotes(proposalId);
        expect(forVotes).to.equal(
          Math.sqrt(voters[2].rifAmount) + Math.sqrt(voters[0].rifAmount),
        );
      });

      it('should calculate the quorum correctly', async () => {
        const quorum = await governor.quorum(
          (await hre.ethers.provider.getBlockNumber()) - 1,
        );
        expect(quorum).to.equal(Math.floor(Math.sqrt(totalSupply)));
      });

      it('quorum should be reached', async () => {
        expect(await governor.quorumReached(proposalId)).to.be.true;
      });

      it('voting should be successfull', async () => {
        expect(await governor.voteSucceeded(proposalId)).to.be.true;
      });
    });

    describe('Proposal execution', () => {
      it('should execute the Proposal and call its target contract', async () => {
        const deadline = (
          await governor.proposalDeadline(proposalId)
        ).toNumber();
        const currentBlock = await hre.ethers.provider.getBlockNumber();
        await skipBlocks(deadline - currentBlock + 1);
        const tx = governor.execute(
          [rifVoteToken.address, governor.address],
          [0, 0],
          [proposalCalldata, setTargetCalldata],
          proposalDescriptionHash,
        );
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
        expect(await governor.proposalTarget()).to.equal(
          proposalTarget.address,
        );
      });
    });
  });
});
