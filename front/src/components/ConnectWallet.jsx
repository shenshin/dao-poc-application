import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';
import NetworkErrorMessage from './NetworkErrorMessage';

function ConnectWallet() {
  const { connect, networkError } = useContext(EthersContext);
  return (
    <>
      <div>{networkError && <NetworkErrorMessage />}</div>
      <p>Connect your wallet</p>
      <button type="button" onClick={connect}>
        Connect wallet!
      </button>
    </>
  );
}

export default ConnectWallet;
