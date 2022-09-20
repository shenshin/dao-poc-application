# RSK Distributed Autonomous Organization (DAO) Proof of Concept (POC) Application

This project demonstrates how to create DAO on [RSK](https://developers.rsk.co/). The governance is carried out by:
- Linear voting using RIF FT count
- Quadratic voting using RIF FT count
- Boolean voting based on RNS NFT

The DAO smart contracts are built with [OpenZeppelin Governance](https://docs.openzeppelin.com/contracts/4.x/api/governance)

## Installation
- rename `.template.secret.json` to `.secret.json` and paste there your seed phrase (mnemonic) for the RSK network
- run the command in terminal
```shell
  npm install
```

## Simulation of a voting for a proposal

To make RSK Testnet transactions from your accounts, make sure each of them has a certain amount of test RBTC.
- Visit [Test RBTC faucet](https://faucet.rsk.co/) to get some.

To deploy smart contracts before the testing you can run the `deploy` task:
```shell
  npx hardhat deploy --type ft-simple --network rsktestnet
```
This command will deploy all the smart contracts, necessary for the Linear RIF token voting on the RSK Testnet. However you don't need to deploy the contracts explicitly. They will be deployed in any case before running tests.

The deployed smart contracts address are stored in a file `deployments.json`. Initially this file has addresses of the following smart contracts deployed on RSK Testnet:
- RIF token
- RIF token faucet
As new contracts are deployed, new addresses will be added to it.

All the tests can be run on any of the following networks:
- hardhat
- rskregtest
- rsktestnet
See the networks details in `hardhat.config.js`

### Linear voting with fungible tokens / RIF tokens

Before testing of voting with RIF tokens, make sure you have at least 10 RIFs on each voter account.
You can run a `dispence` Hardhat task to get test RIF tokens for your accounts automatically.
```shell
  npx hardhat dispense --wallets 8 --network rsktestnet
```
The following tests, launched on `rsktestnet` network demontrates how to:
- create voting tokens by wrapping owned RIF tokens
- delegate voting power
- create a proposal
- vote for the proposal
- execute the proposal
- unwrap and withdraw RIF tokens

#### Successful case
demonstrates the execution of succeeded voting with reached quorum:
```shell
  npx hardhat test test/FT-voting-simple/succeeded.test.js --network rsktestnet
```
#### Failed case
demonastrates the impossibility of execution of a defeated proposal voting:
```shell
  npx hardhat test test/FT-voting-simple/defeated.test.js --network rsktestnet
```
### Quadratic voting with ERC20 Vote tokens
Makes use of the original ERC20 Vote tokens (not wrapped) to vote for a proposal and calculates the voting power by taking a square root of the number of owned vote tokens.

These tests show how to:
- delegate voting power
- create a proposal
- vote for the proposal
- execute the proposal
- make sure proposal is fulfilled

#### Successful case
```shell
  npx hardhat test test/FT-voting-quadratic/succeeded.test.js --network rsktestnet
```
#### Failed case
```shell
  npx hardhat test test/FT-voting-quadratic/defeated.test.js --network rsktestnet
```

### Boolean voting based on NFT
This voting uses ERC721 tokens to delegate voting power. The NFT deployer mints and transfers 1 NFT to every voter after the smart contracts deployment.

The tests demonstrate how to:
- delegate voting power
- create a proposal
- vote for the proposal
- execute the proposal
- make sure proposal is fulfilled

#### Successful case
```shell
  npx hardhat test test/NFT-voting/succeeded.test.js --network rsktestnet
```
#### Failed case
```shell
  npx hardhat test test/NFT-voting/defeated.test.js --network rsktestnet
```

### Cleanning the deployments and Hardhat artifacts

To delete all the recorded addresses of deployed smart contracts, use the `clean` task:
```shell
  npx hardhat clean
```
This command will still keep the addresses of `RIF token` and `RIF token faucet` smart contracts stored in `deployments.json`. Also the task will delete all the Hardhat cache and artifacts.