const { expect } = require('chai');
const hre = require('hardhat');
const { v4: uuidv4 } = require('uuid');
const { skipBlocks, ProposalState, VoteType } = require('../../util');
const { deployContract } = require('../../deploy');
const { deployFtSimple } = require('../../deploy/scripts');

describe('Governance - Revenue Redistribution - Successful', () => {
  let deployer;

  // voters
  let voters;

  // smart contracts
  let rifToken;
  let rifVoteToken;
  let governor;
  let rr;

  // revenue redistribution proposal
  let proposal;
  let proposalId;
  let proposalDescription;
  let proposalDescriptionHash;
  let initiateRrCalldata;

  // proposed redistribution parameters
  const endsAt = Math.floor(Date.now() / 1000) + 600; // seconds
  const percent = 50; // % of the treasury

  const treasurySize = hre.ethers.utils.parseEther('100'); // 100 RBTC
  const votingPower = hre.ethers.BigNumber.from(10n ** 20n); // 10 RIFs
  const redistributionAmount = treasurySize.div(100).mul(percent);

  before(async () => {
    const signers = await hre.ethers.getSigners();
    [deployer] = signers;
    voters = signers.slice(1, 9); // 8 voters

    [rifToken, rifVoteToken, governor] = await deployFtSimple(voters);
    rr = await deployContract(
      'RevenueRedistributor',
      governor.address,
      rifVoteToken.address,
    );

    // transfer RBTC to the `RevenueRedistributor` treasury
    await (
      await deployer.sendTransaction({ value: treasurySize, to: rr.address })
    ).wait();
  });

  describe('Deployment', () => {
    it('Governor and VoteToken addresses should be set on the RR s/c', async () => {
      expect(await rr.governor()).to.equal(governor.address);
      expect(await rr.voteToken()).to.equal(rifVoteToken.address);
    });

    it('RevenueRedistributor treasury should be full', async () => {
      expect(await hre.ethers.provider.getBalance(rr.address)).to.equal(
        treasurySize,
      );
    });

    it('Vote token snapshot was not taken yet', async () => {
      expect(await rifVoteToken.getCurrentSnapshotId()).to.equal(0);
    });
  });

  describe('Wrapping RIF with RIFVote tokens. Votes delegation', () => {
    before(async () => {
      // tx 1: rif -> rifVote approval
      await Promise.all(
        voters.map((voter) =>
          rifToken
            .connect(voter)
            .approve(rifVoteToken.address, votingPower)
            .then((tx) => tx.wait()),
        ),
      );
      // tx 2: mint rifVote tokens
      await Promise.all(
        voters.map((voter) =>
          rifVoteToken
            .connect(voter)
            .depositFor(voter.address, votingPower)
            .then((tx) => tx.wait()),
        ),
      );
      // tx 3: delegate voting power
      await Promise.all(
        voters.map((voter) =>
          rifVoteToken
            .connect(voter)
            .delegate(voter.address)
            .then((tx) => tx.wait()),
        ),
      );
    });

    it('voters should have voting power', async () => {
      await Promise.all(
        voters.map(async (voter) => {
          expect(
            await rifVoteToken.connect(voter).getVotes(voter.address),
          ).to.equal(votingPower);
        }),
      );
    });
  });

  describe('Create proposal for revenue redistribution', () => {
    before(async () => {
      // get unique ID for a new proposal
      proposalDescription = uuidv4();
      // calculating keccak256 hash of th proposal description
      proposalDescriptionHash = hre.ethers.utils.solidityKeccak256(
        ['string'],
        [proposalDescription],
      );

      /* encoding the `initiateRedistribution` function call on the
      `RevenueRedistributor` smart contract */
      initiateRrCalldata = rr.interface.encodeFunctionData(
        'initiateRedistribution',
        [endsAt, percent],
      );
      // it's proposed to call `initiateRedistribution` on the RR while sending 0 RBTC
      proposal = [[rr.address], [0], [initiateRrCalldata]];
      // calculate proposal ID
      proposalId = hre.ethers.BigNumber.from(
        hre.ethers.utils.keccak256(
          hre.ethers.utils.defaultAbiCoder.encode(
            ['address[]', 'uint256[]', 'bytes[]', 'bytes32'],
            [...proposal, proposalDescriptionHash],
          ),
        ),
      );
    });

    it('should create the RR proposal with correct ID', async () => {
      // tx 4: create the revenue redistribution proposal
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
    before(async () => {
      // tx 5: everyone votes for
      await Promise.all(
        voters.map((voter) =>
          governor
            .connect(voter)
            .castVote(proposalId, VoteType.For)
            .then((tx) => tx.wait()),
        ),
      );
      const deadline = (await governor.proposalDeadline(proposalId)).toNumber();
      const currentBlock = await hre.ethers.provider.getBlockNumber();
      await skipBlocks(deadline - currentBlock + 1);
    });

    it('the voting has succeeded', async () => {
      expect(await governor.state(proposalId)).to.equal(
        ProposalState.Succeeded,
      );
    });
  });

  describe('Revenue redistribution', () => {
    const rdId = 1;
    const snapshotId = 1;

    describe('Proposal execution', () => {
      // tx 6: start new redistribution
      it('should initiate the redistribution', async () => {
        await expect(governor.execute(...proposal, proposalDescriptionHash))
          .to.emit(rr, 'RevenueRedistributionInitiated')
          .withArgs(rdId, redistributionAmount, endsAt, snapshotId);
      });
    });

    describe('Vote token snapshot', () => {
      it('snapshot was taken at the moment of RR initiation', async () => {
        expect(await rifVoteToken.getCurrentSnapshotId()).to.equal(snapshotId);
      });
      it('total supply at the snapshot', async () => {
        expect(await rifVoteToken.totalSupplyAt(snapshotId)).to.equal(
          votingPower.mul(voters.length),
        );
      });
      it('balances at the snapshot', async () => {
        await Promise.all(
          voters.map(async (voter) => {
            expect(
              await rifVoteToken.balanceOfAt(voter.address, snapshotId),
            ).to.equal(votingPower);
          }),
        );
      });
    });

    describe('Parameters', () => {
      it('the newly created RD should be active', async () => {
        expect(await rr.isActiveRedistribution(rdId - 1)).to.be.false;
        expect(await rr.isActiveRedistribution(rdId)).to.be.true;
        expect(await rr.isActiveRedistribution(rdId + 1)).to.be.false;
      });

      it('the RD parameters should be set correctly', async () => {
        const rdParams = await rr.redistributions(rdId);
        expect(rdParams.endsAt).to.equal(endsAt);
        expect(rdParams.amount).to.equal(redistributionAmount);
        expect(rdParams.voteTokenSnapshot).to.equal(snapshotId);
      });

      it('revenue amount', async () => {
        const totalSupply = votingPower.mul(voters.length);
        const revenueAmount = redistributionAmount
          .mul(totalSupply)
          .div(votingPower);

        await Promise.all(
          voters.map(async (voter) => {
            const revenue = await rr
              .connect(voter)
              .getRevenueAmount(voter.address);
            expect(revenue).to.equal(revenueAmount);
          }),
        );
      });
    });
  });
});
