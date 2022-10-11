const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const { readFile } = require('fs/promises');
const { join } = require('path');
const {
  deployContractBy,
  writeDeployedAddress,
  readDeployedAddress,
} = require('../deploy');

async function getAbi(name) {
  let abi;
  try {
    const fileName = join(__dirname, '..', 'abi', `${name}.json`);
    abi = JSON.parse(await readFile(fileName, 'utf8'));
  } catch (error) {
    // do nothing
  }
  return abi;
}

async function getContract(name, ...params) {
  const [signer] = await hre.ethers.getSigners();
  let contract;
  const address = await readDeployedAddress(name);
  if (address) {
    const abi = await getAbi(name);
    if (abi) {
      console.log(`Getting ${name} from ABI`);
      contract = new hre.ethers.Contract(address.toLowerCase(), abi, signer);
      contract.getContractAction = 'abiConnect';
    } else {
      console.log(`Getting ${name} from artifact`);
      contract = await hre.ethers.getContractAt(
        name,
        address.toLowerCase(),
        signer,
      );
      contract.getContractAction = 'artifactConnect';
    }
    console.log(
      `Connected to ${name}, previously deployed at ${hre.network.name} with address ${address}`,
    );
  } else {
    contract = await deployContractBy(name, signer, ...params);
    if (hre.network.name !== 'hardhat')
      await writeDeployedAddress(name, contract.address);
    contract.getContractAction = 'deploy';
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

async function getBalances(wallets) {
  const rifToken = await getContract('RIFToken');
  const balances = await Promise.all(
    wallets.map(async (wallet) => ({
      address: wallet.address,
      rbtcBalance: await hre.ethers.provider.getBalance(wallet.address),
      rifBalance: await rifToken.balanceOf(wallet.address),
    })),
  );
  console.log(`\nWallets balances:\n`);
  balances.forEach((balance) => {
    console.log(`${balance.walletId}: ${balance.address}`);
    console.log(`RBTC: ${hre.ethers.utils.formatEther(balance.rbtcBalance)}`);
    console.log(`RIF: ${balance.rifBalance}\n`);
  });
}

function sqrtBN(value) {
  const ONE = ethers.BigNumber.from(1);
  const TWO = ethers.BigNumber.from(2);
  const x = ethers.BigNumber.from(value);
  let z = x.add(ONE).div(TWO);
  let y = x;
  while (z.sub(y).isNegative()) {
    y = z;
    z = x.div(z).add(z).div(TWO);
  }
  return y;
}

module.exports = {
  skipBlocks,
  getBalances,
  getContract,
  sqrtBN,
};
