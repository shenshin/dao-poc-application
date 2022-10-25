import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// creates an ethers.js contract instance
const useContract = ({ artifact, provider }) => {
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
  return contract;
};

export default useContract;
