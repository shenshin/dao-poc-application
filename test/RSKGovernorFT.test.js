/* const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs'); */
const { expect } = require('chai');
const hre = require('hardhat');

async function deployContract(name, ...params) {
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();
  return contract;
}

describe('RIF / RIFVote tokens', () => {
  let deployer;
  let voter1;
  let voter2;
  let voter3;
  let rifToken;
  let rifVoteToken;

  const totalSupply = hre.ethers.BigNumber.from(90);
  const voterRifAmount = totalSupply.div(3);

  before(async () => {
    [deployer, voter1, voter2, voter3] = await hre.ethers.getSigners();
    rifToken = await deployContract('RIFToken', totalSupply);
    rifVoteToken = await deployContract('RIFVoteToken', rifToken.address);
  });

  it('RIF total supply should be minted', async () => {
    expect(await rifToken.totalSupply()).to.equal(totalSupply);
  });

  it('The deployer should transfer all RIF tokens to the Voters equally', async () => {
    const tx1 = rifToken.transfer(voter1.address, voterRifAmount);
    await expect(tx1)
      .to.emit(rifToken, 'Transfer')
      .withArgs(deployer.address, voter1.address, voterRifAmount);
    const tx2 = rifToken.transfer(voter2.address, voterRifAmount);
    await expect(tx2)
      .to.emit(rifToken, 'Transfer')
      .withArgs(deployer.address, voter2.address, voterRifAmount);
    const tx3 = rifToken.transfer(voter3.address, voterRifAmount);
    await expect(tx3)
      .to.emit(rifToken, 'Transfer')
      .withArgs(deployer.address, voter3.address, voterRifAmount);
  });

  it('voters should approve the RIF allowance for RIFVote', async () => {
    const txs = [voter1, voter2, voter3].map((voter) => ({
      voter,
      promise: rifToken.connect(voter).approve(rifVoteToken.address, voterRifAmount),
    }));
    await Promise.all(txs.map((tx) => expect(tx.promise).to.emit(rifToken, 'Approval').withArgs(
      tx.voter.address,
      rifVoteToken.address,
      voterRifAmount,
    )));
  });

  it('each voter allowance for RIFVote should be set on the RIF token', async () => {
    const allowances = await Promise.all(
      [voter1, voter2, voter3].map((vtr) => rifToken.allowance(vtr.address, rifVoteToken.address)),
    );
    allowances.forEach((allowance) => expect(allowance).to.equal(voterRifAmount));
  });

  it('voters should deposit underlying tokens and mint the corresponding number of wrapped tokens', async () => {
    const txs = [voter1, voter2, voter3].map((voter) => ({
      voter,
      promise: rifVoteToken.connect(voter).depositFor(voter.address, voterRifAmount),
    }));
    await Promise.all(txs.map((tx) => expect(tx.promise).to.emit(rifVoteToken, 'Transfer').withArgs(
      hre.ethers.constants.AddressZero,
      tx.voter.address,
      voterRifAmount,
    )));
  });

  it('voters should now own the RIFVote tokens', async () => {
    const balances = await Promise.all(
      [voter1, voter2, voter3].map((voter) => rifVoteToken.balanceOf(voter.address)),
    );
    balances.forEach((balance) => expect(balance).to.equal(voterRifAmount));
  });
});
