const { getContract } = require('../functions.js');

async function mintNftsForVoters(nft, voters) {
  const mintTx = await nft.safeMintBunch(voters.map((voter) => voter.address));
  await mintTx.wait();
  console.log(`Minted NFTs for ${voters.length} voters`);
}

async function deployNftVoting(voters) {
  const [deployer] = voters;
  const nftVoteToken = await getContract({ name: 'RNSVote', signer: deployer });
  if (nftVoteToken.getContractAction === 'deploy')
    await mintNftsForVoters(nftVoteToken, voters);

  const governor = await getContract(
    { name: 'GovernorNFT', signer: deployer },
    nftVoteToken.address,
  );

  const target = await getContract(
    {
      name: 'ProposalTargetNFT',
      signer: deployer,
    },
    governor.address,
  );

  return [nftVoteToken, governor, target];
}

module.exports = deployNftVoting;
