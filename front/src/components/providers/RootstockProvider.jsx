import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RootstockContext from '../../contexts/rootstockContext';
import useContract from '../../hooks/useContract';
import useERC20 from '../../hooks/useERC20';
import { RskNetworkIds, SC_UPDATE_FREQUENCY } from '../../utils/constants';
import scArtifacts from '../../contracts/scArtifacts';

// inject ethers.js and all smart contracts to React context state
function RootstockProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [networkId, setNetworkId] = useState(31);

  useEffect(() => {
    let timeout;
    if (errorMessage) {
      timeout = setTimeout(() => {
        setErrorMessage(null);
      }, SC_UPDATE_FREQUENCY);
    }
    return () => clearTimeout(timeout);
  }, [errorMessage]);

  const resetState = () => {
    setProvider(null);
    setAddress(null);
    setLoading(null);
    setErrorMessage(null);
  };

  const checkNetwork = async (ethersProvider) => {
    const { chainId } = await ethersProvider.getNetwork();
    if (!RskNetworkIds.includes(Number(chainId))) {
      resetState();
      setErrorMessage('Please connect to RSK');
      return false;
    }
    setNetworkId(Number(chainId));
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

  // Smart contracts
  const [rifContract, rifBalance] = useERC20({
    provider,
    address,
    setErrorMessage,
    artifact: scArtifacts?.[networkId]?.rif,
  });
  const [voteTokenContract, voteTokenBalance, voteTotalSupply] = useERC20({
    provider,
    address,
    setErrorMessage,
    artifact: scArtifacts?.[networkId]?.vote,
  });
  const governorContract = useContract({
    provider,
    artifact: scArtifacts?.[networkId]?.governor,
  });
  const rrContract = useContract({
    provider,
    artifact: scArtifacts?.[networkId]?.rr,
  });

  const contextValue = {
    connect,
    provider,
    address,
    errorMessage,
    setErrorMessage,
    loading,
    setLoading,
    resetState,
    // contracts
    rifContract,
    rifBalance,
    voteTokenContract,
    voteTokenBalance,
    voteTotalSupply,
    governorContract,
    rrContract,
  };
  return (
    <RootstockContext.Provider value={contextValue}>
      {children}
    </RootstockContext.Provider>
  );
}

export default RootstockProvider;
