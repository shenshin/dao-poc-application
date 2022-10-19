import { useContext, useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import EthersContext from '../contexts/ethersContext';
import RifContext from '../contexts/rifContext';
import VoteTokenContext from '../contexts/voteTokenContext';

const Container = styled.div``;

function WrapTokens() {
  const { address, setErrorMessage, setLoading } = useContext(EthersContext);
  const { rifContract } = useContext(RifContext);
  const { voteTokenContract } = useContext(VoteTokenContext);

  const [tokenAmount, setTokenAmount] = useState(0);

  const wrapTokens = async () => {
    try {
      setErrorMessage(null);
      // tx 1: rif -> rifVote approval
      const approveTx = await rifContract.approve(tokenAmount);
      setLoading(approveTx.hash);
      await approveTx.wait();
      // tx 2: mint rifVote tokens
      const depositTx = await voteTokenContract.depositFor(
        address,
        tokenAmount,
      );
      setLoading(depositTx.hash);
      await depositTx.wait();
      // tx 3: delegate voting power
      const delegateTx = await voteTokenContract.delegate(address);
      setLoading(delegateTx.hash);
      await delegateTx.wait();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(null);
    }
  };
  const updateTokenAmount = (event) => {
    const value = ethers.BigNumber.from(event.target.value).mul(1e18);
    setTokenAmount(value);
  };
  return (
    <Container>
      <input
        type="number"
        value={`${tokenAmount.div(1e18)}`}
        onChange={updateTokenAmount}
      />
      <p>sfs</p>
      <button type="button" onClick={wrapTokens}>
        Exchange RIFs to Vote tokens
      </button>
    </Container>
  );
}

export default WrapTokens;
