import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';

function WaitingForTxMessage() {
  const { txBeingSent } = useContext(EthersContext);
  return (
    txBeingSent && (
      <div>
        Waiting for transaction <strong>{txBeingSent}</strong>
      </div>
    )
  );
}

export default WaitingForTxMessage;
