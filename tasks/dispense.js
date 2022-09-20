const { task } = require('hardhat/config');
const { getBalances, getSigners, getContract } = require('../util');
const rifFaucetAbi = require('../abi/rifFaucet.json');

// connects to test RIF faucet and dispenses the tokens to
// supplied wallets
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
        `Couldn't dispense RIF tokens for ${tx.reason.transaction.from}`,
      );
    });
}

// Usage example:
// `npx hardhat dispense --wallets 8 --network rsktestnet`
// will create 8 signers and dispence 10 test RIFs to each of them.
// !important: select `rsktestnet`
module.exports = task(
  'dispense',
  'Get test RIF tokens from the RSK Testnet faucet',
)
  .addOptionalParam(
    'wallets',
    'Number of wallets to dispense RIFs',
    20,
    types.int,
  )
  .setAction(async ({ wallets }) => {
    try {
      const signers = await getSigners(0, wallets);
      await getBalances(signers);
      await getTestRifs(signers);
    } catch (error) {
      console.log(error.message);
    }
  });
