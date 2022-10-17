import { useState, useEffect } from 'react';
import useContract from './useContract';

const BALANCE_REFRESH = 5000; // 5 seconds

const useERC20 = ({ artifact, provider }) => {
  const [balance, setBalance] = useState(0);
  const { contract } = useContract({ artifact, provider });

  // retrieve token balances
  useEffect(() => {
    let interval;
    if (contract) {
      const getBalance = async () => {
        const [address] = await provider.listAccounts();
        setBalance(await contract.balanceOf(address));
      };
      getBalance();
      interval = setInterval(getBalance, BALANCE_REFRESH);
    }
    return () => clearInterval(interval);
  }, [contract, provider]);

  return {
    contract,
    balance,
  };
};

export default useERC20;
