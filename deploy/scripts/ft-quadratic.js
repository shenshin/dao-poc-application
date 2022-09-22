const { getContract } = require('../../util');

async function transferTokensToVoters(rifToken, voters) {
  async function transferRifs(i = 0) {
    // don't transfer to deployer (i = 0)
    if (i < voters.length - 1) {
      const voter = voters[i + 1];
      const rifDecimals = hre.ethers.BigNumber.from(10).pow(18);
      const votingPower = hre.ethers.BigNumber.from(10)
        .pow(2 * i)
        .mul(rifDecimals);
      // 100 ** i * 10 ** 18; // 1, 100, 10000, 1000000 * 10^18 vote tokens
      const tx = await rifToken.transfer(voter.address, votingPower);
      await tx.wait();
      console.log(
        `Transferred ${votingPower.div(rifDecimals)} RIFs to ${voter.address}`,
      );
      await transferRifs(i + 1);
    }
  }
  await transferRifs();
}

async function deployFtQuadratic(voters) {
  const [deployer] = voters;
  const rifVoteToken = await getContract(
    { name: 'QuadraticVoteToken', signer: deployer },
    '10101000000000000000000',
  );
  if (rifVoteToken.getContractAction === 'deploy')
    await transferTokensToVoters(rifVoteToken, voters);
  const governor = await getContract(
    {
      name: 'GovernorFtQuadratic',
      signer: deployer,
    },
    rifVoteToken.address,
  );
  const proposalTarget = await getContract(
    {
      name: 'ProposalTargetQuadratic',
      signer: deployer,
    },
    governor.address,
  );
  return [rifVoteToken, governor, proposalTarget];
}

module.exports = deployFtQuadratic;
