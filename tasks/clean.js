const { task } = require('hardhat/config');
const fs = require('fs/promises');
const { files } = require('../deploy');

// override the Hardhat `clean` task to also clean the deployments file
// Usage example:
// `npx hardhat clean`
module.exports = task(
  'clean',
  'Cleans the cache, deletes all artifacts and deployments',
  async (args, hre, runSuper) => {
    await runSuper();
    await fs.rm(files.contracts);
  },
);
