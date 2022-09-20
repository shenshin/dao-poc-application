const fs = require('fs/promises');
const { mine } = require('@nomicfoundation/hardhat-network-helpers');
const rifTokenAbi = require('../abi/rifToken.json');

async function readDeployments() {
  let deployments;
  try {
    deployments = JSON.parse(
      await fs.readFile(hre.config.deploymentsFile, 'utf8'),
    );
  } catch (error) {
    deployments = {};
  }
  return deployments;
}

async function writeDeployments(deployments) {
  const file = hre.config.deploymentsFile;
  return fs.writeFile(file, JSON.stringify(deployments), 'utf8');
}

async function readDeployedAddress(contractName) {
  const deployments = await readDeployments();
  return deployments?.[hre.network.name]?.[contractName];
}

async function writeDeployedAddress(contractName, address) {
  const deployments = await readDeployments();
  if (!(hre.network.name in deployments)) {
    deployments[hre.network.name] = {};
  }
  deployments[hre.network.name][contractName] = address;
  await writeDeployments(deployments);
  console.log(
    `recorded ${contractName} address to ${hre.config.deploymentsFile}`,
  );
}

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
  console.log(
    `${name} was deployed by ${deployer.address} at ${hre.network.name} with address ${contract.address}`,
  );
  return contract;
}

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
  deployContract,
  deployContractBy,
  skipBlocks,
  getSigners,
  getBalances,
  getContract,
  readDeployedAddress,
  writeDeployedAddress,
  sqrtBN,
  readDeployments,
  writeDeployments,
};
