import './App.css';
import useEthers from './hooks/useEthers';
import useRIFToken from './hooks/useRIFToken';
import useVoteToken from './hooks/useVoteToken';
import ConnectWallet from './components/ConnectWallet';
import WaitingForTxMessage from './components/WaitingForTxMessage';

function App() {
  const {
    connect,
    provider,
    account,
    networkError,
    dismissNetworkError,
    txBeingSent,
    setTxBeingSent,
    setTxError,
  } = useEthers();
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
    return (
      <ConnectWallet
        connectWallet={connect}
        networkError={networkError}
        dismiss={dismissNetworkError}
      />
    );
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
