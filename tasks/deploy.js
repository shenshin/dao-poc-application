const { task } = require('hardhat/config');
const { getSigners } = require('../util');
const {
  deployFtQuadratic,
  deployFtSimple,
  deployNftVoting,
} = require('../util/deployments');

module.exports = task('deploy', 'Deploys DAO smart contracts')
  .addParam(
    'type',
    `Select smart contracts set from 'ft-simple', 'ft-quadratic', 'nft'`,
  )
  .addOptionalParam('voters', 'Number of voters', 8, types.int)
  .setAction(async ({ voters: votersNumber, type }, hre) => {
    await hre.run('compile');
    const voters = await getSigners(0, votersNumber);
    switch (type) {
      case 'ft-simple':
        return deployFtSimple(voters);
      case 'ft-quadratic':
        return deployFtQuadratic(voters);
      case 'nft':
        return deployNftVoting(voters);
      default:
        throw new Error('Unknown voting type');
    }
  });
