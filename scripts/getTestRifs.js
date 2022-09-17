const { getBalances, getSigners } = require('../util');
const rifFaucetAbi = require('../abi/rifFaucet.json');

const rifFaucet = new hre.ethers.Contract(
  hre.config.tokens.rifFaucet.toLowerCase(),
  rifFaucetAbi,
  hre.ethers.provider,
);

async function getTestRifs(wallets) {
  const txs = await Promise.allSettled(
    wallets.map(async (wallet) => {
      const txRequest = await rifFaucet
        .connect(wallet)
        .dispense(wallet.address);
      txRequest.walletId = wallet.walletId;
      return txRequest.wait();
    }),
  );
  function printReport(status = 'rejected', message = '') {
    const promises = txs.filter((tx) => tx.status === status);
    console.log(
      `${message}: ${promises
        .map((tx) => tx.reason.transaction.walletId)
        .join(', ')}`,
    );
  }
  // printReport('fulfilled', 'Topped up RIF token balance for the wallets');
  printReport('rejected', `Couldn't dispence RIF tokens for the wallets`);
}

async function main() {
  try {
    const signers = await getSigners(0, 1);
    await getBalances(signers);
    await getTestRifs(signers);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

main();
