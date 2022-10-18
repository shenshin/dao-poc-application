import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';

function NetworkErrorMessage() {
  const { networkError, dismissNetworkError } = useContext(EthersContext);
  return (
    networkError && (
      <div>
        {networkError}
        <button type="button" onClick={dismissNetworkError}>
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    )
  );
}

export default NetworkErrorMessage;
