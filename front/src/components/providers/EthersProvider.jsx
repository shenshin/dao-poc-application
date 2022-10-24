/* eslint-disable react/jsx-no-constructed-context-values */
import EthersContext from '../../contexts/ethersContext';

import useEthers from '../../hooks/useEthers';
import useRIFToken from '../../hooks/useRIFToken';
import useVoteToken from '../../hooks/useVoteToken';
import useGovernor from '../../hooks/useGovernor';
import useRR from '../../hooks/useRR';

// inject ethers.js and all smart contracts to React context state
function EthersProvider({ children }) {
  const ethersProps = useEthers();
  const rifProps = useRIFToken(ethersProps);
  const voteTokenProps = useVoteToken(ethersProps);
  const governorProps = useGovernor(ethersProps);
  const rrProps = useRR(ethersProps);
  const contextValue = {
    ...ethersProps,
    ...rifProps,
    ...voteTokenProps,
    ...governorProps,
    ...rrProps,
  };
  return (
    <EthersContext.Provider value={contextValue}>
      {children}
    </EthersContext.Provider>
  );
}

export default EthersProvider;
