import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';

function LoadingMessage() {
  const { loading } = useContext(EthersContext);
  return (
    loading && (
      <div>
        <strong>{loading}</strong>
      </div>
    )
  );
}

export default LoadingMessage;
