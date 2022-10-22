import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SC_UPDATE_FREQUENCY } from '../utils/constants';

function useRbtcBalance({ address, provider, setErrorMessage }) {
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    let interval;
    if (address && provider) {
      const getBalance = async () => {
        try {
          setErrorMessage(null);
          const weiBalance = await provider.getBalance(address);
          setBalance(ethers.utils.formatEther(weiBalance));
        } catch (error) {
          setErrorMessage(error.message);
        }
      };
      getBalance();
      interval = setInterval(getBalance, SC_UPDATE_FREQUENCY);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, provider]);

  return balance;
}

export default useRbtcBalance;
