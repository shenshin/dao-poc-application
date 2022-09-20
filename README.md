# RSK Distributed Autonomous Organization (DAO) Proof of Concept (POC) Application

This project demonstrates how to create DAO on [RSK](https://developers.rsk.co/). The governance is carried out by:
- Linear voting using RIF FT count
- Quadratic voting using RIF FT count
- Boolean voting based on RNS NFT

The DAO smart contracts are built with [OpenZeppelin Governance](https://docs.openzeppelin.com/contracts/4.x/api/governance)

## Installation
- rename `.template.secret.json` to `.secret.json` and paste there your seed phrase (mnemonic)
- run the command in terminal
```shell
npm install
```
## Testing
```shell
npm test
```