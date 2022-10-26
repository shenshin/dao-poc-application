import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RootstockContext from '../../contexts/rootstockContext';
import useContract from '../../hooks/useContract';
import useERC20 from '../../hooks/useERC20';
import {
  RSK_TESTNET_NETWORK_ID,
  SC_UPDATE_FREQUENCY,
} from '../../utils/constants';
// smart contract artifacts
import rifArtifact from '../../contracts/31/RIFToken.json';
import voteArtifact from '../../contracts/31/RIFVoteToken.json';
import governorArtifact from '../../contracts/31/GovernorFT.json';
import rrArtifact from '../../contracts/31/RevenueRedistributor.json';

// inject ethers.js and all smart contracts to React context state
function RootstockProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

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

  // Smart contracts
  const [rifContract, rifBalance] = useERC20({
    provider,
    address,
    setErrorMessage,
    artifact: rifArtifact,
  });
  const [voteTokenContract, voteTokenBalance, voteTotalSupply] = useERC20({
    provider,
    address,
    setErrorMessage,
    artifact: voteArtifact,
  });
  const governorContract = useContract({
    provider,
    artifact: governorArtifact,
  });
  const rrContract = useContract({ provider, artifact: rrArtifact });

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
