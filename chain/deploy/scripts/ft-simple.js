const { getContract } = require('../../util');

async function transferRifsToVoters(rifToken, voters) {
  const votingPower = 10n ** 20n;
  async function transferRifs(wallets = []) {
    const [voter] = wallets;
    if (voter) {
      const tx = await rifToken.transfer(voter.address, votingPower);
      await tx.wait();
      console.log(`Transferred 100 RIFs to ${voter.address}`);
      await transferRifs(wallets.slice(1));
    }
  }
  await transferRifs([...voters]);
}

// on RSK regtest transfer some tRBTC to Rootstock treasury
async function transferRbtcToTreasury(deployer, rrAddress, amount = '1000') {
  if (hre.network.name === 'rskregtest') {
    const tx = await deployer.sendTransaction({
      to: rrAddress,
      value: hre.ethers.utils.parseEther(amount),
    });
    await tx.wait();
    console.log(`Transferred ${amount} RBTC to the Rootstock treasury`);
  }
}

async function deployFtSimple(voters) {
  const rifToken = await getContract('RIFToken', 10n ** 5n);
  if (rifToken.getContractAction === 'deploy')
    await transferRifsToVoters(rifToken, voters);

  const rifVoteToken = await getContract('RIFVoteToken', rifToken.address);
  const governor = await getContract('GovernorFT', rifVoteToken.address);
  const proposalTarget = await getContract('ProposalTarget', governor.address);
  const rr = await getContract(
    'RevenueRedistributor',
    governor.address,
    rifVoteToken.address,
  );
  await transferRbtcToTreasury(voters[0], rr.address);
  return [rifToken, rifVoteToken, governor, proposalTarget, rr];
}

module.exports = deployFtSimple;
