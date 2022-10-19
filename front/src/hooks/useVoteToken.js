import useERC20 from './useERC20';
import artifact from '../contracts/31/RIFVoteToken.json';

const useVoteToken = ({ provider }) => {
  const { contract, balance } = useERC20({
    artifact,
    provider,
  });
  return {
    voteTokenContract: contract,
    voteTokenBalance: balance,
  };
};

export default useVoteToken;
