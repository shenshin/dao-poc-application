const { join } = require('path');
require('@nomicfoundation/hardhat-toolbox');
require('./tasks/deploy.js');
// require('hardhat-contract-sizer');
const { mnemonic } = require('./.secret.json');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    hardhat: {},
    rskregtest: {
      chainId: 33,
      url: 'http://localhost:4444',
      accounts: 'remote',
    },
    rsktestnet: {
      chainId: 31,
      url: 'https://public-node.testnet.rsk.co/',
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
  },
  mocha: {
    timeout: 6000000,
  },
  deploymentsFile: join(__dirname, 'deployments.json'),
  /*   contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  }, */
};
