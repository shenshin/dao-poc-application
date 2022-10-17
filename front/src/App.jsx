import { useContext } from 'react';
import './App.css';
import ConnectWallet from './components/ConnectWallet';
import WaitingForTxMessage from './components/WaitingForTxMessage';
import EthersContext from './contexts/ethersContext';
import RifContext from './contexts/rifContext';
import VoteTokenContext from './contexts/voteTokenContext';

function App() {
  const { account, txBeingSent } = useContext(EthersContext);
  const { rifBalance, approve } = useContext(RifContext);
  const { voteTokenContract, voteTokenBalance } = useContext(VoteTokenContext);

  if (!account) {
    return <ConnectWallet />;
  }
  return (
    <div className="App">
      {txBeingSent && <WaitingForTxMessage txHash={txBeingSent} />}
      <p>{`Selected account: ${account}`}</p>
      <p>{`RIF balance: ${rifBalance}`}</p>
      <p>{`Vote token balance: ${voteTokenBalance}`}</p>
      <button
        type="button"
        onClick={() => approve(voteTokenContract.address, 10n ** 18n)}
      >
        Approve few RIFs
      </button>
    </div>
  );
}

export default App;
