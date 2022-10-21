import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';
import ErrorMessage from './ErrorMessage';

function ConnectWallet() {
  const { connect } = useContext(EthersContext);
  return (
    <div>
      <ErrorMessage />
      <p>Connect your wallet</p>
      <button type="button" onClick={connect}>
        Connect wallet!
      </button>
    </div>
  );
}

export default ConnectWallet;
