import useContract from './useContract';
import artifact from '../contracts/31/RevenueRedistributor.json';

const useRR = (props) => {
  const { contract } = useContract({ artifact, ...props });

  return {
    rrContract: contract,
  };
};

export default useRR;