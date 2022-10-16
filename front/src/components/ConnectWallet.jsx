import NetworkErrorMessage from './NetworkErrorMessage';

function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <>
      <div>
        {networkError && (
          <NetworkErrorMessage message={networkError} dismiss={dismiss} />
        )}
      </div>
      <p>Connect your wallet</p>
      <button type="button" onClick={connectWallet}>
        Connect wallet!
      </button>
    </>
  );
}

export default ConnectWallet;
