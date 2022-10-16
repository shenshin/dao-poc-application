function WaitingForTxMessage({ txHash }) {
  return (
    <div>
      Waiting for transaction <strong>{txHash}</strong>
    </div>
  );
}

export default WaitingForTxMessage;
