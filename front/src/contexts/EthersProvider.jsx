import EthersContext from './ethersContext';
import useEthers from '../hooks/useEthers';

function EthersProvider({ children }) {
  const ethersProps = useEthers();
  return (
    <EthersContext.Provider value={ethersProps}>
      {children}
    </EthersContext.Provider>
  );
}

export default EthersProvider;
