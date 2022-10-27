# Setup instructions

## Installation

```
npm install
```

## Mnemonic

```
mv chain/.template.secret.json chain/.secret.json
```

and add your seed phrase there, e.g.

```json
{
    "mnemonic": "crawl taste inject exact piece flush tent embody raven divide advance space"
}
```

## RSK Regtest

- run RSKj with regtest configuration
    - reference [RSKj for developers](https://developers.rsk.co/kb/rskj-for-developers/)
    - example command:

```
java \
  -Drpc.providers.web.cors='*' \
  -Dminer.client.autoMine=true \
  -cp rskj-core-4.1.0-HOP-all.jar \
  co.rsk.Start \
  --regtest \
  --reset
```

- To deploy the smart contracts run in the `chain` directory

```bash
cd chain
npx hardhat deploy --type ft-simple --network rskregtest
```

This command will also copy s/c artifacts to the frontend.

- if you want to deploy them again later, don't forget to clean the saved s/c addresses by running

```bash
npx hardhat clean
```

## RSK Testnet

TODO

## Front end application

- In Metamask import "cow", "cow1", "cow2" accounts by entering their keccak256 hashes as private keys:
    - c85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4
    - 0c06818f82e04c564290b32ab86b25676731fc34e9a546108bf109194c8e3aae
    - 88fcad7d65de4bf854b88191df9bf38648545e7e5ea367dff6e025b06a28244d

- To run the react application, execute in the `front` directory

```bash
cd front
npm install
npm start
```

## RSK Testnet

TODO
