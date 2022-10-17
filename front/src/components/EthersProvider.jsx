import EthersContext from '../contexts/ethersContext';
import RifContext from '../contexts/rifContext';
import VoteTokenContext from '../contexts/voteTokenContext';
import useEthers from '../hooks/useEthers';
import useRIFToken from '../hooks/useRIFToken';
import useVoteToken from '../hooks/useVoteToken';

function EthersProvider({ children }) {
  const ethersProps = useEthers();
  const rifProps = useRIFToken(ethersProps);
  const voteTokenProps = useVoteToken(ethersProps);
  return (
    <EthersContext.Provider value={ethersProps}>
      <RifContext.Provider value={rifProps}>
        <VoteTokenContext.Provider value={voteTokenProps}>
          {children}
        </VoteTokenContext.Provider>
      </RifContext.Provider>
    </EthersContext.Provider>
  );
}

export default EthersProvider;
