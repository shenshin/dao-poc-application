const { task } = require('hardhat/config');
const { readDeployments, writeDeployments } = require('../util');

const contractNamesToKeep = ['RIFToken', 'RIFFaucet'];

// override the Hardhat `clean` task to also clean the deployments file
// Usage example:
// `npx hardhat clean`
// cleans all artifacts and deployments except the smart contracts
// listed in `contractNamesToKeep`
module.exports = task(
  'clean',
  'Cleans the cache, deletes all artifacts and deployments',
  async (args, hre, runSuper) => {
    await runSuper();
    const deployments = await readDeployments();
    // delete all contracts from deployments except the ones
    // listed in `contractNamesToKeep`
    const contractsToKeep = Object.entries(deployments.rsktestnet).reduce(
      (previous, [key, value]) => {
        const newEntry = contractNamesToKeep.includes(key)
          ? { [key]: value }
          : {};
        return { ...previous, ...newEntry };
      },
      {},
    );
    await writeDeployments({
      rsktestnet: contractsToKeep,
    });
  },
);
