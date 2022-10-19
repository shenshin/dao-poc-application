import { ethers } from 'ethers';

import { useState } from 'react';

const RSK_TESTNET_NETWORK_ID = 31;

const useEthers = () => {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [txBeingSent, setTxBeingSent] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  const [txError, setTxError] = useState(null);

  const resetState = () => {
    setProvider(null);
    setAccount(null);
    setTxBeingSent(null);
    setNetworkError(null);
    setTxError(null);
  };

  const checkNetwork = async (ethersProvider) => {
    const { chainId } = await ethersProvider.getNetwork();
    if (chainId !== RSK_TESTNET_NETWORK_ID) {
      resetState();
      setNetworkError('Please connect to RSK Testnet');
      return false;
    }
    return true;
  };

  const initialiseWeb3Provider = async () => {
    const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
    if (!(await checkNetwork(ethersProvider))) return;
    const [selectedAddress] = await ethersProvider.listAccounts();
    setProvider(ethersProvider);
    setAccount(selectedAddress);
  };

  const addEventListeners = () => {
    window.ethereum.on('accountsChanged', initialiseWeb3Provider);
    window.ethereum.on('chainChanged', initialiseWeb3Provider);
  };

  const connect = async () => {
    // if Metamsk is not installed
    if (window.ethereum === undefined) {
      setNetworkError('Please install Metamask');
      return;
    }
    await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    initialiseWeb3Provider();
    addEventListeners();
  };

  const dismissNetworkError = () => {
    setNetworkError(null);
  };

  return {
    connect,
    provider,
    account,
    networkError,
    setNetworkError,
    dismissNetworkError,
    txBeingSent,
    setTxBeingSent,
    txError,
    setTxError,
    resetState,
  };
};

export default useEthers;
