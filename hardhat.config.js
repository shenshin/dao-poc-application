require('@nomicfoundation/hardhat-toolbox');
const { mnemonic } = require('./.secret.json');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.9',
    optimizer: { enabled: true, runs: 200 },
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
    ropsten: {
      url: `https://ropsten.infura.io/v3/637a166b44254d19830b8b60ea60a67b`,
      accounts: {
        mnemonic,
      },
    },
  },
  mocha: {
    timeout: 6000000,
  },
};
