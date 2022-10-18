import useERC20 from './useERC20';
import artifact from '../contracts/31/RIFVoteToken.json';

const useVoteToken = (props) => {
  const { contract, balance } = useERC20({ artifact, ...props });
  return {
    voteTokenContract: contract,
    voteTokenBalance: balance,
  };
};

export default useVoteToken;
