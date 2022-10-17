import useContract from './useContract';
import artifact from '../contracts/31/RIFVoteToken.json';

const useVoteToken = ({ provider }) => {
  const { contract, balance, getBalance } = useContract({
    artifact,
    provider,
  });
  return {
    voteTokenContract: contract,
    voteTokenBalance: balance,
    getVoteTokenBalance: getBalance,
  };
};

export default useVoteToken;
