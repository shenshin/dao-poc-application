import { useContext } from 'react';
import './App.css';
import useRIFToken from './hooks/useRIFToken';
import useVoteToken from './hooks/useVoteToken';
import ConnectWallet from './components/ConnectWallet';
import WaitingForTxMessage from './components/WaitingForTxMessage';
import EthersContext from './contexts/ethersContext';

function App() {
  const { provider, account, txBeingSent, setTxBeingSent, setTxError } =
    useContext(EthersContext);
  const { rifBalance, getRifBalance, approve } = useRIFToken(
    provider,
    setTxBeingSent,
    setTxError,
  );
  const { voteTokenContract, voteTokenBalance, getVoteTokenBalance } =
    useVoteToken(provider);
  const getBalances = () => {
    getRifBalance();
    getVoteTokenBalance();
  };
  if (!account) {
    return <ConnectWallet />;
  }
  return (
    <div className="App">
      {txBeingSent && <WaitingForTxMessage txHash={txBeingSent} />}
      <p>{`Selected account: ${account}`}</p>
      <p>{`RIF balance: ${rifBalance}`}</p>
      <p>{`Vote token balance: ${voteTokenBalance}`}</p>
      <button type="button" onClick={getBalances}>
        Get Balances
      </button>
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
