import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import EthersContext from '../../contexts/ethersContext';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  RouteNames,
} from '../../utils/constants';
import Container from '../../styles/container';
import Note from '../../styles/note';

function UnwrapTokens() {
  const navigate = useNavigate();
  const {
    address,
    setErrorMessage,
    setLoading,
    voteTokenContract,
    voteTokenBalance,
  } = useContext(EthersContext);

  // actual token balance / 10^18
  const [tokenAmount, setTokenAmount] = useState(0);

  const unwrapTokens = async () => {
    try {
      setErrorMessage(null);
      const tokensToWithdraw = ethers.BigNumber.from(tokenAmount).mul(
        10n ** 18n,
      );
      const tx = await voteTokenContract.withdrawTo(address, tokensToWithdraw);
      setLoading(`Sending tx ${tx.hash}`);
      await tx.wait();
      navigate(RouteNames.enfranchisement);
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
        <h4>Unwrapping RIF tokens</h4>
        <p>Select a number of Vote tokens to exchange back to RIF tokens</p>
      </Note>
      <div>
        <label htmlFor="vote-token-amount">
          <input
            type="number"
            value={tokenAmount}
            min={0}
            max={voteTokenBalance}
            onChange={updateTokenAmount}
            name="vote-token-amount"
          />
          &nbsp;Vote tokens
        </label>
      </div>
      <button type="button" onClick={unwrapTokens}>
        Unwrap Vote tokens to RIFs
      </button>
    </Container>
  );
}

export default UnwrapTokens;
