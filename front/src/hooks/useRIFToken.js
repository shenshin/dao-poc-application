import useERC20 from './useERC20';
import artifact from '../contracts/31/RIFToken.json';

const useRIFToken = (props) => {
  const { contract, balance } = useERC20({ artifact, ...props });

  return {
    rifContract: contract,
    rifBalance: balance,
  };
};

export default useRIFToken;
