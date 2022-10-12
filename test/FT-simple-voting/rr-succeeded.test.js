const { expect } = require('chai');
const hre = require('hardhat');
const { v4: uuidv4 } = require('uuid');
const { skipBlocks, ProposalState, VoteType } = require('../../util');
const { deployContract } = require('../../deploy');
const { deployFtSimple } = require('../../deploy/scripts');

describe('Governance - Revenue Redistribution - Successful', () => {
  // voters
  let voters;
  let votersAgainst;
  let votersFor;
  let votersAbstain;

  // smart contracts
  let rifToken;
  let rifVoteToken;
  let governor;
  let rr;

  const votingPower = hre.ethers.BigNumber.from(10n ** 20n); // 10 RIFs

  before(async () => {
    voters = (await hre.ethers.getSigners()).slice(1, 9); // 8 voters
    votersAgainst = voters.slice(0, 2); // 20 votes Against
    votersFor = voters.slice(2, 5); // 30 votes For
    votersAbstain = voters.slice(5, 8); // 3 votes Abstain

    [rifToken, rifVoteToken, governor] = await deployFtSimple(voters);
    rr = await deployContract(
      'RevenueRedistributor',
      governor.address,
      rifVoteToken.address,
    );
  });

  describe('Deployment', () => {
    it('Governor and VoteToken addresses should be set on the RR s/c', async () => {
      expect(await rr.governor()).to.equal(governor.address);
      expect(await rr.voteToken()).to.equal(rifVoteToken.address);
    });
  });
});
