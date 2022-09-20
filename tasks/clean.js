const { task } = require('hardhat/config');
const { readDeployments, writeDeployments } = require('../util');

const contracNamesToKeep = ['RIFToken', 'RIFFaucet'];

// override the Hardhat `clean` task to also clean the deployments file
// Usage example:
// `npx hardhat clean`
// cleans all artifacts and deployments except the smart contracts
// listed in `contracNamesToKeep`
module.exports = task(
  'clean',
  'Clears the cache, deletes all artifacts and deployments',
  async (args, hre, runSuper) => {
    await runSuper();
    const deployments = await readDeployments();
    // delete all contracts from deployments except the ones
    // listed in `contracNamesToKeep`
    const contractsToKeep = Object.entries(deployments.rsktestnet).reduce(
      (previous, [key, value]) => {
        const newEntry = contracNamesToKeep.includes(key)
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
