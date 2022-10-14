const { getContract } = require('../../util');

async function mintNftsForVoters(nft, voters) {
  const mintTx = await nft.safeMintBunch(voters.map((voter) => voter.address));
  await mintTx.wait();
  console.log(`Minted NFTs for ${voters.length} voters`);
}

async function deployNftBoolean(voters) {
  const nftVoteToken = await getContract('RNSVote');
  if (nftVoteToken.getContractAction === 'deploy')
    await mintNftsForVoters(nftVoteToken, voters);

  const governor = await getContract('GovernorNFT', nftVoteToken.address);

  const target = await getContract('ProposalTargetNFT', governor.address);

  return [nftVoteToken, governor, target];
}

module.exports = deployNftBoolean;
