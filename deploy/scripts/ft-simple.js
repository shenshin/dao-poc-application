const { getContract } = require('../../util');

async function transferRifsToVoters(rifToken, voters) {
  const votingPower = 10n ** 20n;
  async function transferRifs(wallets = []) {
    const [voter] = wallets;
    if (voter) {
      const tx = await rifToken.transfer(voter.address, votingPower);
      await tx.wait();
      console.log(`Transferred 10 RIFs to ${voter.address}`);
      await transferRifs(wallets.slice(1));
    }
  }
  await transferRifs([...voters]);
}

async function deployFtSimple(voters) {
  const rifToken = await getContract('RIFToken', 10n ** 27n);
  if (rifToken.getContractAction === 'deploy')
    await transferRifsToVoters(rifToken, voters);

  const rifVoteToken = await getContract('RIFVoteToken', rifToken.address);
  const governor = await getContract('GovernorFT', rifVoteToken.address);
  const proposalTarget = await getContract('ProposalTarget', governor.address);
  return [rifToken, rifVoteToken, governor, proposalTarget];
}

module.exports = deployFtSimple;
