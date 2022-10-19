import useContract from './useContract';
import artifact from '../contracts/31/GovernorFT.json';

const useGovernor = ({ provider }) => {
  const { contract } = useContract({
    artifact,
    provider,
  });

  return {
    governorContract: contract,
  };
};

export default useGovernor;
