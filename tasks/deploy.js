const { task } = require('hardhat/config');
const { getSigners } = require('../util');
const {
  deployFtQuadratic,
  deployFtSimple,
  deployNftVoting,
} = require('../util/deployments');

// deploy smart contracts from the
// 'ft-simple', 'ft-quadratic' and 'nft' voting

// Usage example:
// `npx hardhat deploy --type ft-quadratic --voters 4 --network rskregtest`
// will deploy quadratic voting smart contracts to RSK regtest
module.exports = task('deploy', 'Deploys DAO smart contracts')
  .addParam(
    'type',
    `Select smart contracts set from 'ft-simple', 'ft-quadratic', 'nft'`,
  )
  .addOptionalParam('voters', 'Number of voters', 8, types.int)
  .setAction(async ({ voters: votersNumber, type }, hre) => {
    try {
      await hre.run('compile');
      const voters = await getSigners(0, votersNumber);
      switch (type) {
        case 'ft-simple':
          await deployFtSimple(voters);
          return;
        case 'ft-quadratic':
          await deployFtQuadratic(voters);
          return;
        case 'nft':
          await deployNftVoting(voters);
          return;
        default:
          throw new Error('Unknown voting type');
      }
    } catch (error) {
      console.log(error.message);
    }
  });
