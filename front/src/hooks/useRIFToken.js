import useERC20 from './useERC20';
import artifact from '../contracts/31/RIFToken.json';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const useRIFToken = ({ provider, setTxBeingSent, setTxError }) => {
  const { contract, balance } = useERC20({
    artifact,
    provider,
  });
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
