import useERC20 from './useERC20';
import artifact from '../contracts/31/RIFToken.json';
import { ERROR_CODE_TX_REJECTED_BY_USER } from '../utils/constants';

const useRIFToken = (props) => {
  const { setTxBeingSent, setTxError } = props;
  const { contract, balance } = useERC20({ artifact, ...props });
  const approve = async (address, amount) => {
    try {
      const tx = await contract.approve(address, amount);
      setTxBeingSent(tx.hash);
      await tx.wait();
    } catch (error) {
      if (error.code !== ERROR_CODE_TX_REJECTED_BY_USER) {
        setTxError(error.message);
      }
    } finally {
      setTxBeingSent(null);
    }
  };
  return {
    rifContract: contract,
    rifBalance: balance,
    approve,
  };
};

export default useRIFToken;
