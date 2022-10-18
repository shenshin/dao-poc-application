import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';
import NetworkErrorMessage from './NetworkErrorMessage';

function ConnectWallet() {
  const { connect } = useContext(EthersContext);
  return (
    <div>
      <NetworkErrorMessage />
      <p>Connect your wallet</p>
      <button type="button" onClick={connect}>
        Connect wallet!
      </button>
    </div>
  );
}

export default ConnectWallet;
