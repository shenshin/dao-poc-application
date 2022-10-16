import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const useContract = (artifact, provider) => {
  const [balance, setBalance] = useState(0);
  const [contract, setContract] = useState(null);
  useEffect(() => {
    if (!(provider && artifact)) return;
    setContract(
      new ethers.Contract(
        artifact.address.toLowerCase(),
        artifact.abi,
        provider.getSigner(0),
      ),
    );
  }, [provider, artifact]);
  const getBalance = async () => {
    const [address] = await provider.listAccounts();
    setBalance(await contract.balanceOf(address));
  };
  return {
    contract,
    balance,
    getBalance,
  };
};

export default useContract;
