require('@nomicfoundation/hardhat-toolbox');
const { mnemonic } = require('./.secret.json');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.9',
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
    ganache: {
      url: 'http://127.0.0.1:7545',
    },
  },
  mocha: {
    timeout: 600000,
  },
};
