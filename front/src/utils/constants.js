export const ERROR_CODE_TX_REJECTED_BY_USER = 'ACTION_REJECTED';
export const SC_UPDATE_FREQUENCY = 5000; // 5 seconds
export const RSK_TESTNET_NETWORK_ID = 31;
export const RIF_DECIMALS = 10n ** 18n;
export const VoteOptions = ['Against', 'For', 'Abstain'];
export const ProposalState = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Queued: 5,
  Expired: 6,
  Executed: 7,
};
export const RouteNames = {
  enfranchisement: '/enfranchisement',
  createRrProposal: '/create-rr-proposal',
  voteForProposal: '/vote',
  executeProposal: '/execute-proposal',
  acquireRevenue: '/acquire-revenue',
  unwrapTokens: '/unwrap-tokens',
};
