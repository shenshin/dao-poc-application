import { useContext } from 'react';
import RootstockContext from '../contexts/rootstockContext';

function LoadingMessage() {
  const { loading } = useContext(RootstockContext);
  return (
    loading && (
      <div>
        <strong>{loading}</strong>
      </div>
    )
  );
}

export default LoadingMessage;
