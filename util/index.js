const { mine } = require('@nomicfoundation/hardhat-network-helpers');

async function deployContract(name, ...params) {
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();
  return contract;
}

function skipBlocks(blocksToSkip) {
  return new Promise((resolve) => {
    (async () => {
      if (hre.network.name === 'hardhat') {
        await mine(blocksToSkip);
        resolve();
      } else {
        const deadline =
          (await hre.ethers.provider.getBlockNumber()) + blocksToSkip;
        hre.ethers.provider.on('block', (blockNumber) => {
          if (blockNumber >= deadline) resolve();
        });
      }
    })();
  });
}

function getSigners(from = 0, to = 20) {
  if (to <= from) throw new Error(`'to' index should be bigger than 'from'`);
  const { mnemonic, path } = hre.network.config.accounts;
  const signers = [];
  for (let i = from; i < to; i += 1) {
    signers.push(
      hre.ethers.Wallet.fromMnemonic(mnemonic, `${path}/${i}`).connect(
        hre.ethers.provider,
      ),
    );
  }
  return signers;
}

module.exports = {
  deployContract,
  skipBlocks,
  getSigners,
};
