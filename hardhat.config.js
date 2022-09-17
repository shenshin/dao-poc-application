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
      deployed: {
        RIFToken: '0x3e0921236e9E97c58598D06db3E6F156FF1E3824',
        RIFVoteToken: '0xFB31ae30611a8145d89a2141fffE91F02355CDC4',
        GovernorFT: '0x44aa8Dc224A2dc25141728cf38ba0b9512575c31',
        ProposalTarget: '0x6523F508Dc0fC1933973a4da85FbC8b49aEd7AA2',
      },
    },
    rsktestnet: {
      chainId: 31,
      url: 'https://public-node.testnet.rsk.co/',
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      deployed: {
        RIFToken: '0x19f64674D8a5b4e652319F5e239EFd3bc969a1FE',
        RIFVoteToken: '0xe60763718FA5400Ddc2B574e36cC62D61391B94a',
        GovernorFT: '0xe010E9bA1591659bd5C9260F7870d6c076F00E7A',
        ProposalTarget: '0xd2659cA925dE06871dc92F8DA287320Ca20Bd722',
        rifFaucet: '0x19f64674D8a5b4e652319F5e239EFd3bc969a1FE',
      },
    },
  },
  mocha: {
    timeout: 6000000,
  },
  /*   contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  }, */
};
