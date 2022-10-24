import { useState, useEffect } from 'react';
import useContract from './useContract';
import { SC_UPDATE_FREQUENCY, RIF_DECIMALS } from '../utils/constants';

const useERC20 = ({ setErrorMessage, address, provider, artifact }) => {
  const [balance, setBalance] = useState(0);
  const [supply, setSupply] = useState(0);
  const contract = useContract({ artifact, provider });

  // retrieve token balances every few seconds
  useEffect(() => {
    let interval;
    if (provider && contract) {
      const getBalance = async () => {
        try {
          setErrorMessage(null);
          const bal = await contract.balanceOf(address);
          const sup = await contract.totalSupply();
          setBalance(bal.div(RIF_DECIMALS).toNumber());
          setSupply(sup.div(RIF_DECIMALS).toNumber());
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

  return [contract, balance, supply];
};

export default useERC20;
