const { getContract } = require('../functions.js');
const rifTokenAbi = require('../../abi/rifToken.json');

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

async function deployFtSimple(voters) {
  const [deployer] = voters;
  const rifToken = await getContract(
    {
      name: 'RIFToken',
      abi: rifTokenAbi,
      signer: deployer,
    },
    '1000000000000000000000000000',
  );
  if (rifToken.getContractAction === 'deploy')
    await transferRifsToVoters(rifToken, voters);

  const rifVoteToken = await getContract(
    {
      name: 'RIFVoteToken',
      signer: deployer,
    },
    rifToken.address,
  );
  const governor = await getContract(
    {
      name: 'GovernorFT',
      signer: deployer,
    },
    rifVoteToken.address,
  );
  const proposalTarget = await getContract(
    {
      name: 'ProposalTarget',
      signer: deployer,
    },
    governor.address,
  );
  return [rifToken, rifVoteToken, governor, proposalTarget];
}

module.exports = deployFtSimple;
