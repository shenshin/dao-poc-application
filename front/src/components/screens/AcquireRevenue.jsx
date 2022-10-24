import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import EthersContext from '../../contexts/ethersContext';
import Container from '../../styles/container';
import Note from '../../styles/note';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  RouteNames,
} from '../../utils/constants';

function AcquireRevenue() {
  const navigate = useNavigate();
  const { rrContract, setErrorMessage, setLoading } = useContext(EthersContext);
  const acqureRevenue = async () => {
    try {
      setErrorMessage(null);
      const txRequest = await rrContract.aquireRevenue();
      setLoading(`Sending tx ${txRequest.hash}`);
      await txRequest.wait();
      navigate(RouteNames.unwrapTokens);
    } catch (error) {
      if (error.code !== ERROR_CODE_TX_REJECTED_BY_USER) {
        setErrorMessage(error.message);
      }
    } finally {
      setLoading(null);
    }
  };
  return (
    <Container>
      <Note>
        <h4>Aquire revenue</h4>
        <p>Revenue redistribution should be initiated</p>
      </Note>
      <button type="button" onClick={acqureRevenue}>
        Acquire
      </button>
    </Container>
  );
}

export default AcquireRevenue;
