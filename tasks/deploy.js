const { task } = require('hardhat/config');
const { deployContractBy, getSigners, getContract } = require('../util');
const rifTokenAbi = require('../abi/rifToken.json');

async function transferRifsToVoters(rifToken, voters) {
  const votingPower = '100000000000000000000';
  async function transferRifs(wallets = []) {
    const [voter] = wallets;
    if (voter) {
      const tx = await rifToken.transfer(voter.address, votingPower);
      await tx.wait();
      console.log(`Transferred 10 RIFs to ${voter.address}`);
      await transferRifs(wallets.slice(1));
    }
  }
  await transferRifs(voters.slice(1));
}

async function getRifContract(voters) {
  const totalRifSupply = '1000000000000000000000000000';
  const [deployer] = voters;
  const address = hre.network.config?.deployed?.RIFToken;
  let rif;
  if (address) {
    rif = new hre.ethers.Contract(address.toLowerCase(), rifTokenAbi, deployer);
    console.log(
      `Using RIFToken, previously deployed at ${hre.network.name} with address ${address}`,
    );
  } else {
    rif = await deployContractBy('RIFToken', deployer, totalRifSupply);
    console.log(
      `RIF was deployed by ${deployer.address} at ${hre.network.name} with address ${rif.address}`,
    );
    await transferRifsToVoters(rif, voters);
  }
  return rif;
}

module.exports = task('deploy', 'Deploys DAO smart contracts')
  .addOptionalParam(
    'voters',
    'Number of voters to transfer RIFs to',
    8,
    types.int,
  )
  .setAction(async ({ voters: votersNumber }) => {
    const voters = await getSigners(0, votersNumber);
    const [deployer] = voters;

    const rifToken = await getRifContract(voters);

    const rifVoteToken = await getContract(
      'RIFVoteToken',
      deployer,
      rifToken.address,
    );
    const governor = await getContract(
      'GovernorFT',
      deployer,
      rifVoteToken.address,
    );
    const proposalTarget = await getContract(
      'ProposalTarget',
      deployer,
      governor.address,
    );
    return [rifToken, rifVoteToken, governor, proposalTarget];
  });
