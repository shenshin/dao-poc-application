import { useContext } from 'react';
import RootstockContext from '../contexts/rootstockContext';
import ErrorMessage from './ErrorMessage';

function ConnectWallet() {
  const { connect } = useContext(RootstockContext);
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
