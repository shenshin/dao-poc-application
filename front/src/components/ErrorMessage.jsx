import { useContext } from 'react';
import EthersContext from '../contexts/ethersContext';

function ErrorMessage() {
  const { errorMessage, setErrorMessage } = useContext(EthersContext);
  return (
    errorMessage && (
      <div>
        {errorMessage}
        <button type="button" onClick={() => setErrorMessage(null)}>
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    )
  );
}

export default ErrorMessage;
