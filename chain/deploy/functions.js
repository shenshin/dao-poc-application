const fs = require('fs/promises');
const files = require('./files.js');

async function readDeployments(file) {
  let deployments;
  try {
    deployments = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    deployments = {};
  }
  return deployments;
}

async function writeDeployments(deployments) {
  return fs.writeFile(files.contracts, JSON.stringify(deployments), 'utf8');
}

async function readDeployedAddress(contractName) {
  const external = await readDeployments(files.external);
  const contracts = await readDeployments(files.contracts);
  return (
    external?.[hre.network.name]?.[contractName] ??
    contracts?.[hre.network.name]?.[contractName]
  );
}

async function writeDeployedAddress(contractName, address) {
  const external = await readDeployments(files.external);
  // if contracts is not deployed externally on the current network
  if (!external?.[hre.network.name]?.[contractName]) {
    const contracts = await readDeployments(files.contracts);
    if (!(hre.network.name in contracts)) {
      contracts[hre.network.name] = {};
    }
    contracts[hre.network.name][contractName] = address;
    await writeDeployments(contracts);
    console.log(`recorded ${contractName} address to ${files.contracts}`);
  } else {
    console.log(`Skipping externally deployed contract ${contractName}`);
  }
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

module.exports = {
  deployContract,
  deployContractBy,
  readDeployedAddress,
  writeDeployedAddress,
};
