const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const {
  deployContractBy,
  writeDeployedAddress,
  readDeployedAddress,
} = require('../deploy');
const rifTokenAbi = require('../abi/rifToken.json');

async function getContract({ name, abi, signer }, ...params) {
  const address = await readDeployedAddress(name);
  const [deployer] = await hre.ethers.getSigners();
  let contract;
  if (address) {
    if (abi) {
      console.log(`Getting ${name} from ABI`);
      contract = new hre.ethers.Contract(
        address.toLowerCase(),
        abi,
        signer ?? deployer,
      );
      contract.getContractAction = 'abiConnect';
    } else {
      console.log(`Getting ${name} from artifact`);
      contract = await hre.ethers.getContractAt(
        name,
        address.toLowerCase(),
        signer ?? deployer,
      );
      contract.getContractAction = 'artifactConnect';
    }
    console.log(
      `Connected to ${name}, previously deployed at ${hre.network.name} with address ${address}`,
    );
  } else {
    contract = await deployContractBy(name, signer ?? deployer, ...params);
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
  const rifToken = await getContract({ name: 'RIFToken', abi: rifTokenAbi });
  const balances = await Promise.all(
    wallets.map(async (wallet) => ({
      walletId: wallet.walletId,
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
  getSigners,
  getBalances,
  getContract,
  sqrtBN,
};
