const { expect } = require('chai');
const hre = require('hardhat');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { v4: uuidv4 } = require('uuid');
const { skipBlocks, ProposalState, VoteType } = require('../../util');
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
  const duration = 3600; // seconds
  const percent = 50; // % of the treasury

  const treasurySize = hre.ethers.utils.parseEther('0.05'); // RBTC
  const votingPower = hre.ethers.BigNumber.from(10n ** 19n); // RIFs
  const redistributionAmount = treasurySize.div(100).mul(percent);

  before(async () => {
    const signers = await hre.ethers.getSigners();
    [deployer] = signers;
    voters = signers.slice(1, 9);

    [rifToken, rifVoteToken, governor, , rr] = await deployFtSimple(voters);

    // transfer RBTC to the `RevenueRedistributor` treasury
    const rrBalance = await hre.ethers.provider.getBalance(rr.address);
    if (rrBalance.lt(treasurySize)) {
      await (
        await deployer.sendTransaction({ value: treasurySize, to: rr.address })
      ).wait();
    }
  });

  describe('Deployment', () => {
    it('Governor and VoteToken addresses should be set on the RR s/c', async () => {
      expect((await rr.governor()).toLowerCase()).to.equal(
        governor.address.toLowerCase(),
      );
      expect((await rr.voteToken()).toLowerCase()).to.equal(
        rifVoteToken.address.toLowerCase(),
      );
    });

    it('RevenueRedistributor treasury should be full', async () => {
      expect(
        (await hre.ethers.provider.getBalance(rr.address)).gte(treasurySize),
      ).to.be.true;
    });

    it('voters should have enough tokens', async () => {
      await Promise.all(
        voters.map(async (voter, i) => {
          const rifBalance = await rifToken.balanceOf(voter.address);
          expect(rifBalance.gte(votingPower.mul(i + 1))).to.be.true;
        }),
      );
    });
  });

  describe('Wrapping RIF with RIFVote tokens. Votes delegation', () => {
    // tx 1: rif -> rifVote approval
    it('voters should approve the RIF allowance for RIFVote', async () => {
      await Promise.all(
        voters.map((voter, i) =>
          expect(
            rifToken
              .connect(voter)
              .approve(rifVoteToken.address, votingPower.mul(i + 1)),
          )
            .to.emit(rifToken, 'Approval')
            .withArgs(
              voter.address,
              hre.ethers.utils.getAddress(rifVoteToken.address),
              votingPower.mul(i + 1),
            ),
        ),
      );
    });
    // tx 2: mint rifVote tokens
    it('voters should deposit underlying tokens and mint the corresponding number of wrapped tokens', async () => {
      await Promise.all(
        voters.map((voter, i) =>
          expect(
            rifVoteToken
              .connect(voter)
              .depositFor(voter.address, votingPower.mul(i + 1)),
          )
            .to.emit(rifVoteToken, 'Transfer')
            .withArgs(
              hre.ethers.constants.AddressZero,
              voter.address,
              votingPower.mul(i + 1),
            ),
        ),
      );
    });
    // tx 3: delegate voting power
    it('RIFVote token holders should self-delegate the voting power', async () => {
      await Promise.all(
        voters.map(async (voter, i) => {
          const tx = await rifVoteToken.connect(voter).delegate(voter.address);
          await tx.wait();
          expect(
            await rifVoteToken.connect(voter).getVotes(voter.address),
          ).to.equal(votingPower.mul(i + 1));
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
        [duration, percent],
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
      await skipBlocks(1);
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
    let revenues;

    before(async () => {
      const voteTokenSupply = voters.reduce(
        (p, c, i) => p.add(votingPower.mul(i + 1)),
        hre.ethers.BigNumber.from('0'),
      );
      revenues = voters.map((voter, i) =>
        redistributionAmount.mul(votingPower.mul(i + 1)).div(voteTokenSupply),
      );
    });

    describe('Proposal execution', () => {
      // tx 6: start new redistribution
      it('should initiate the redistribution', async () => {
        await expect(governor.execute(...proposal, proposalDescriptionHash))
          .to.emit(rr, 'RevenueRedistributionInitiated')
          .withArgs(rdId, redistributionAmount, anyValue, snapshotId);
      });
    });

    describe('Vote token snapshot', () => {
      it('snapshot was taken at the moment of RR initiation', async () => {
        expect(await rifVoteToken.getCurrentSnapshotId()).to.equal(snapshotId);
      });
      it('total supply at the snapshot is recorded', async () => {
        expect(await rifVoteToken.totalSupplyAt(snapshotId)).to.equal(
          await rifVoteToken.totalSupply(),
        );
      });
      it('balances at the snapshot are recorded', async () => {
        await Promise.all(
          voters.map(async (voter, i) => {
            expect(
              await rifVoteToken.balanceOfAt(voter.address, snapshotId),
            ).to.equal(votingPower.mul(i + 1));
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

      it('the active redistribution parameters should be set correctly', async () => {
        const rdParams = await rr.redistributions(rdId);
        expect(rdParams.amount).to.equal(redistributionAmount);
        expect(rdParams.voteTokenSnapshot).to.equal(snapshotId);
      });

      it('revenue amount should be calculated correctly', async () => {
        await Promise.all(
          voters.map(async (voter, i) => {
            expect(
              await rr.connect(voter).getRevenueAmount(voter.address),
            ).to.equal(revenues[i]);
          }),
        );
      });
    });

    describe('Acquire the revenue', () => {
      // tx 7: revenue withdrawal
      it('holders should acquire their revenue', async () => {
        await Promise.all(
          voters.map((voter, i) =>
            expect(rr.connect(voter).aquireRevenue())
              .to.emit(rr, 'RevenueAcquired')
              .withArgs(voter.address, revenues[i]),
          ),
        );
      });

      it('holders can not withdraw the revenue again', async () => {
        await Promise.all(
          voters.map((voter) =>
            expect(rr.connect(voter).aquireRevenue()).to.be.revertedWith(
              'the revenue was already acquired',
            ),
          ),
        );
      });
    });
  });
  describe('Unwrapping RIF tokens', () => {
    // tx 8: burn vote tokens - redeem rif tokens
    it('should unwrap vote tokens to obtain RIF tokens', async () => {
      await Promise.all(
        voters.map(async (voter, i) => {
          const rifBalance = await rifToken.balanceOf(voter.address);
          const withdrawTx = await rifVoteToken
            .connect(voter)
            .withdrawTo(voter.address, votingPower.mul(i + 1));
          await withdrawTx.wait();
          expect(await rifToken.balanceOf(voter.address)).to.equal(
            rifBalance.add(votingPower.mul(i + 1)),
          );
        }),
      );
    });
  });
});
