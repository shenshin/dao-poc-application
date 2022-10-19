import useContract from './useContract';
import artifact from '../contracts/31/RevenueRedistributor.json';

const useRR = ({ provider }) => {
  const { contract } = useContract({
    artifact,
    provider,
  });

  return {
    RRContract: contract,
  };
};

export default useRR;
