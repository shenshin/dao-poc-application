import { useState, useEffect } from 'react';
import useContract from './useContract';
import { SC_UPDATE_FREQUENCY } from '../utils/constants';

const useERC20 = ({ artifact, provider }) => {
  const [balance, setBalance] = useState(0);
  const { contract } = useContract({ artifact, provider });

  // retrieve token balances every few seconds
  useEffect(() => {
    let interval;
    if (contract) {
      const getBalance = async () => {
        const [address] = await provider.listAccounts();
        setBalance(await contract.balanceOf(address));
      };
      getBalance();
      interval = setInterval(getBalance, SC_UPDATE_FREQUENCY);
    }
    return () => clearInterval(interval);
  }, [contract, provider]);

  return {
    contract,
    balance,
  };
};

export default useERC20;
