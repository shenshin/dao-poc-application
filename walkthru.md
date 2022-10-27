# Revenue redistribution mockup

## RSK regtest

After following `./setup.md` instructions

- In the browser address bar enter
```
http://localhost:3000/
```
- Press `Connect wallet` button
- Connect Metamask in a pop-up window
- The app will open the `Enfranchisement` section
- Application sections menu is on the left side of the page
- Dashboard is at the page top 
- Look at the dashboard, make sure the account has a certain amount of RIF tokens.

### Enfranchisement

- In the `Enfranchisement` block enter a number of RIF tokens to wrap with Vote tokens.
- Press `Wrap RIFs with Vote tokens` button
- Confirm 3 transactions in Metamask window
    - approve RIF transfer
    - mint Vote token
    - self-delegate voting power
- You can switch to another imported Metamask account to wrap RIFs for another voter.
- After the transactions are minted, the app will open the `Create RR proposal` section

### Create RR proposal

- Now any Vote token holder with delegated voting power is able to create a proposal
- Look at the dashboard and make sure the `Rootstock treasury` has some RBTC
- Enter a percent of that treasury to distribute
- Enter a duration of redistribution (not voting) in minutes
- Enter a proposal description. This field should be unique in subsequent proposals
- Press `Submit Proposal` button
- Confirm transaction in Metamask window
- After the transaction is minted, the app will open the `Vote for proposal` section

### Vote for proposal

- Hurry up! In this demo app you only have a few minutes (100 blocks) for the voting process
- From the dropdown menu select the just created proposal's description
- Select your vote type (for, against, abstain)
- Press `Cast vote` button
- Confirm transaction in Metamask window
- You can switch to another Metamask account to vote by another voter.
- After the transaction is minted, the app will navigate to `Execute proposal` section

### Execute proposal

- Select the just voted proposal
- Press `Execute` button
- Confirm transaction in Metamask window
- The app will navigate to `Acquire revenue` section

### Acquire revenue

- Find the earned RBTC amount
- Press `Acquire` button
- Confirm transaction in Metamask window
- See how the treasury amount and the account balance change after the transaction is minted

### Unwrap RIF tokens

- If you want you can unwrap Vote tokens back to RIF tokens. You will loose the voting power.
- Select a number of vote tokens to unwrap
- Confirm with the button and Metamask window
