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
        await hre.network.provider.send('hardhat_mine', [
          `0x${blocksToSkip.toString(16)}`,
        ]);
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

module.exports = {
  deployContract,
  skipBlocks,
};
