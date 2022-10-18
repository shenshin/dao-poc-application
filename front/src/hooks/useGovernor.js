import useContract from './useContract';
import artifact from '../contracts/31/GovernorFT.json';

const useGovernor = (props) => {
  const { contract } = useContract({ artifact, ...props });

  return {
    governorContract: contract,
  };
};

export default useGovernor;
