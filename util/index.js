const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const rifTokenAbi = require('../abi/rifToken.json');

async function deployContract(name, ...params) {
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();
  console.log(
    `${name} was deployed at ${hre.network.name} with address ${contract.address}`,
  );
  return contract;
}

async function deployContractBy(name, deployer, ...params) {
  const ContractFactory = await ethers.getContractFactory(name);
  const contract = await ContractFactory.connect(deployer).deploy(...params);
  await contract.deployed();
  return contract;
}

async function getContract(name, signer, ...params) {
  const address = hre.network.config?.deployed?.[name];
  let contract;
  if (address) {
    contract = await hre.ethers.getContractAt(
      name,
      address.toLowerCase(),
      signer,
    );
    console.log(
      `Using ${name}, previously deployed at ${hre.network.name} with address ${address}`,
    );
  } else {
    contract = await deployContractBy(name, signer, ...params);
    console.log(
      `${name} was deployed by ${signer.address} at ${hre.network.name} with address ${contract.address}`,
    );
  }
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

async function getSigners(from = 0, to = 20) {
  if (from < 0 || to <= from) throw new Error('Invalid wallet numbers');
  const { mnemonic, path } = hre.network.config.accounts;
  let signers = [];
  if (mnemonic && path) {
    for (let i = from; i < to; i += 1) {
      const wallet = hre.ethers.Wallet.fromMnemonic(
        mnemonic,
        `${path}/${i}`,
      ).connect(hre.ethers.provider);
      wallet.walletId = i;
      signers.push(wallet);
    }
  } else {
    signers = await hre.ethers.getSigners();
    signers.forEach((signer, walletId) => {
      // eslint-disable-next-line no-param-reassign
      signer.walletId = walletId;
    });
    signers = signers.slice(from, to);
  }
  return signers;
}

async function getBalances(wallets) {
  const rifToken = new hre.ethers.Contract(
    hre.network.config.deployed.rif.toLowerCase(),
    rifTokenAbi,
    hre.ethers.provider,
  );
  const balances = await Promise.all(
    wallets.map(async (wallet) => ({
      walletId: wallet.walletId,
      address: wallet.address,
      rbtcBalance: await hre.ethers.provider.getBalance(wallet.address),
      rifBalance: await rifToken.balanceOf(wallet.address),
    })),
  );
  console.log(`Wallets balances:\n`);
  balances.forEach((balance) => {
    console.log(`${balance.walletId}: ${balance.address}`);
    console.log(`RBTC: ${hre.ethers.utils.formatEther(balance.rbtcBalance)}`);
    console.log(`RIF: ${balance.rifBalance}\n`);
  });
}

module.exports = {
  deployContract,
  deployContractBy,
  skipBlocks,
  getSigners,
  getBalances,
  getContract,
};
