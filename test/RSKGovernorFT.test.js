/* const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs'); */
const { expect } = require('chai');
const hre = require('hardhat');

describe('GLDToken', () => {
  let deployer;

  before(async () => {
    [deployer] = await hre.ethers.getSigners();
  });

  it('test', async () => {
    //
  });
});
