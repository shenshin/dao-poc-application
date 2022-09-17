const { expect } = require('chai');
const hre = require('hardhat');
const { v4: uuidv4 } = require('uuid');
const { skipBlocks, getSigners } = require('../../util');
const { ProposalState, VoteType } = require('../../test/constants.js');
const rifTokenAbi = require('../../abi/rifToken.json');

describe('Testnet contracts', () => {
  // voters
  let deployer;
  let voters;
  let votersAgainst;
  let votersFor;

  // smart contracts
  let rifToken;
  let rifVoteToken;
  let governor;
  let proposalTarget;

  // proposal
  let proposalDescription;
  let proposalDescriptionHash;
  let proposal;
  let proposalId;
  let proposalCalldata;

  const votingPower = '100000000000000000000';

  before(async () => {
    voters = await getSigners(0, 8);
    [deployer] = voters;
    votersAgainst = voters.slice(0, 2);
    votersFor = voters.slice(2);

    rifToken = new hre.ethers.Contract(
      hre.network.config.deployed.rif.toLowerCase(),
      rifTokenAbi,
      deployer,
    );

    rifVoteToken = await hre.ethers.getContractAt(
      'RIFVoteToken',
      hre.network.config.deployed.rifVote.toLowerCase(),
      deployer,
    );

    governor = await hre.ethers.getContractAt(
      'GovernorFT',
      hre.network.config.deployed.governor.toLowerCase(),
      deployer,
    );

    proposalTarget = await hre.ethers.getContractAt(
      'ProposalTarget',
      hre.network.config.deployed.proposalTarget.toLowerCase(),
      deployer,
    );
  });

  describe('delegating voting power', () => {
    it('each voter should have at least 10 RIFs', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          const rifBalance = await rifToken.balanceOf(voter.address);
          expect(rifBalance.gte(votingPower)).to.be.true;
        }),
      );
    });
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

      proposalDescriptionHash = hre.ethers.utils.solidityKeccak256(
        ['string'],
        [proposalDescription],
      );

      proposalCalldata = governor.interface.encodeFunctionData(
        'updateProposalTarget',
        [proposalTarget.address],
      );

      proposal = [[governor.address], [0], [proposalCalldata]];

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

    it('deployer should be able to create a proposal', async () => {
      await skipBlocks(1);
      const tx = await governor
        .connect(deployer)
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

    it('it should store the given votes', async () => {
      const proposalVotes = await governor.proposalVotes(proposalId);
      expect(proposalVotes.againstVotes).to.equal(
        hre.ethers.BigNumber.from(votingPower).mul(votersAgainst.length),
      );
      expect(proposalVotes.forVotes).to.equal(
        hre.ethers.BigNumber.from(votingPower).mul(votersFor.length),
      );
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
