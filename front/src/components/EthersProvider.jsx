import EthersContext from '../contexts/ethersContext';
import RifContext from '../contexts/rifContext';
import VoteTokenContext from '../contexts/voteTokenContext';
import GovernorContext from '../contexts/governorContext';
import RRContext from '../contexts/RRContext';

import useEthers from '../hooks/useEthers';
import useRIFToken from '../hooks/useRIFToken';
import useVoteToken from '../hooks/useVoteToken';
import useGovernor from '../hooks/useGovernor';
import useRR from '../hooks/useRR';

// inject ethers.js and all smart contracts to React context state
function EthersProvider({ children }) {
  const ethersProps = useEthers();
  const rifProps = useRIFToken(ethersProps);
  const voteTokenProps = useVoteToken(ethersProps);
  const governorProps = useGovernor(ethersProps);
  const rrProps = useRR(ethersProps);
  return (
    <EthersContext.Provider value={ethersProps}>
      <RifContext.Provider value={rifProps}>
        <VoteTokenContext.Provider value={voteTokenProps}>
          <GovernorContext.Provider value={governorProps}>
            <RRContext.Provider value={rrProps}>{children}</RRContext.Provider>
          </GovernorContext.Provider>
        </VoteTokenContext.Provider>
      </RifContext.Provider>
    </EthersContext.Provider>
  );
}

export default EthersProvider;
