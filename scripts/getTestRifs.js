const { getBalances, getSigners, getContract } = require('../util');
const rifFaucetAbi = require('../abi/rifFaucet.json');

async function getTestRifs(wallets) {
  const rifFaucet = await getContract({
    name: 'RIFFaucet',
    abi: rifFaucetAbi,
  });

  const txs = await Promise.allSettled(
    wallets.map(async (wallet) => {
      const txRequest = await rifFaucet
        .connect(wallet)
        .dispense(wallet.address);
      return txRequest.wait();
    }),
  );
  // fulfilled transactions
  txs
    .filter((tx) => tx.status === 'fulfilled')
    .forEach((tx) => {
      console.log(`Topped up RIF token balance for ${tx.value.from}`);
    });
  // rejected transactions
  txs
    .filter((tx) => tx.status === 'rejected')
    .forEach((tx) => {
      console.log(
        `Couldn't dispence RIF tokens for ${tx.reason.transaction.from}`,
      );
    });
}

async function main() {
  try {
    const signers = await getSigners(0, 40);
    await getBalances(signers);
    await getTestRifs(signers);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

main();
