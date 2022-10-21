import { useState, useEffect } from 'react';
import useContract from './useContract';
import { SC_UPDATE_FREQUENCY } from '../utils/constants';

const useERC20 = (props) => {
  const { setErrorMessage, address, provider } = props;
  const [balance, setBalance] = useState(0);
  const { contract } = useContract(props);

  // retrieve token balances every few seconds
  useEffect(() => {
    let interval;
    if (provider && contract) {
      const getBalance = async () => {
        try {
          setErrorMessage(null);
          const bal = await contract.balanceOf(address);
          setBalance(bal.div(10n ** 18n).toNumber());
        } catch (error) {
          setErrorMessage(error.message);
        }
      };
      getBalance();
      interval = setInterval(getBalance, SC_UPDATE_FREQUENCY);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, contract]);

  return {
    contract,
    balance,
  };
};

export default useERC20;
