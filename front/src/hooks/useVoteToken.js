import useContract from './useContract';
import voteTokenArtifact from '../contracts/31/RIFVoteToken.json';

const useVoteToken = (provider) => {
  const { contract, balance, getBalance } = useContract(
    voteTokenArtifact,
    provider,
  );
  return {
    voteTokenContract: contract,
    voteTokenBalance: balance,
    getVoteTokenBalance: getBalance,
  };
};

export default useVoteToken;
