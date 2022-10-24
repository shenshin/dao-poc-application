import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import EthersContext from '../contexts/ethersContext';
import { ERROR_CODE_TX_REJECTED_BY_USER, RouteNames } from '../utils/constants';
import Container from '../styles/container';
import Note from '../styles/note';

function Enfranchisement() {
  const {
    address,
    setErrorMessage,
    setLoading,
    rifContract,
    rifBalance,
    voteTokenContract,
  } = useContext(EthersContext);

  // actual token balance / 10^18
  const [tokenAmount, setTokenAmount] = useState(0);

  const navigate = useNavigate();

  const wrapTokens = async () => {
    try {
      const tokensToExchange = ethers.BigNumber.from(tokenAmount).mul(
        10n ** 18n,
      );
      setErrorMessage(null);
      // tx 1: rif -> rifVote approval
      const approveTx = await rifContract.approve(
        voteTokenContract.address,
        tokensToExchange,
      );
      setLoading(`Sending tx ${approveTx.hash}`);
      await approveTx.wait();
      // tx 2: mint rifVote tokens
      const depositTx = await voteTokenContract.depositFor(
        address,
        tokensToExchange,
      );
      setLoading(`Sending tx ${depositTx.hash}`);
      await depositTx.wait();
      // tx 3: delegate voting power
      const delegateTx = await voteTokenContract.delegate(address);
      setLoading(`Sending tx ${delegateTx.hash}`);
      await delegateTx.wait();
      navigate(RouteNames.createRrProposal);
    } catch (error) {
      if (error.code !== ERROR_CODE_TX_REJECTED_BY_USER) {
        setErrorMessage(error.message);
      }
    } finally {
      setLoading(null);
    }
  };
  const updateTokenAmount = (event) => {
    setTokenAmount(Number(event.target.value));
  };
  return (
    <Container>
      <Note>
        <h4>Enfranchisement</h4>
        <p>
          To become a member of the RIF DAO, you must exchange your RIF tokens
          to Vote tokens.
        </p>
        <p>Select a number of RIF token to exchange to Vote tokens.</p>
        <p>Confirm 3 transactions after pressing the button:</p>
        <ol>
          <li>
            Set an approval for the Vote token s/c to dispose a number of owned
            RIF tokens
          </li>
          <li>Mint a corresponding number of Vote tokens</li>
          <li>Self-delegate the voting power</li>
        </ol>
      </Note>
      <div>
        <label htmlFor="rif-token-amount">
          Enter RIF tokens amount&nbsp;
          <input
            type="number"
            value={tokenAmount}
            min={0}
            max={rifBalance}
            onChange={updateTokenAmount}
            name="rif-token-amount"
          />
        </label>
      </div>
      <button type="button" onClick={wrapTokens}>
        Wrap RIFs with Vote tokens
      </button>
    </Container>
  );
}

export default Enfranchisement;
