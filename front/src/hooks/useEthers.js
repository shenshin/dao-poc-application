import { ethers } from 'ethers';

import { useState } from 'react';

const RSK_TESTNET_NETWORK_ID = 31;

const useEthers = () => {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const resetState = () => {
    setProvider(null);
    setAddress(null);
    setLoading(null);
    setErrorMessage(null);
  };

  const checkNetwork = async (ethersProvider) => {
    const { chainId } = await ethersProvider.getNetwork();
    if (chainId !== RSK_TESTNET_NETWORK_ID) {
      resetState();
      setErrorMessage('Please connect to RSK Testnet');
      return false;
    }
    return true;
  };

  const initialiseWeb3Provider = async () => {
    const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
    if (!(await checkNetwork(ethersProvider))) return;
    const [selectedAddress] = await ethersProvider.listAccounts();
    setProvider(ethersProvider);
    setAddress(selectedAddress);
  };

  const addEventListeners = () => {
    window.ethereum.on('accountsChanged', initialiseWeb3Provider);
    window.ethereum.on('chainChanged', initialiseWeb3Provider);
  };

  const connect = async () => {
    // if Metamsk is not installed
    if (window.ethereum === undefined) {
      setErrorMessage('Please install Metamask');
      return;
    }
    await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    initialiseWeb3Provider();
    addEventListeners();
  };

  return {
    connect,
    provider,
    address,
    errorMessage,
    setErrorMessage,
    loading,
    setLoading,
    resetState,
  };
};

export default useEthers;
