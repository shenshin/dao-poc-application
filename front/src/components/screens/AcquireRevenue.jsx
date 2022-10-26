import { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import RootstockContext from '../../contexts/rootstockContext';
import Container from '../../styles/container';
import Note from '../../styles/note';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  SC_UPDATE_FREQUENCY,
  RouteNames,
} from '../../utils/constants';

function AcquireRevenue() {
  const navigate = useNavigate();
  const { address, rrContract, setErrorMessage, setLoading } =
    useContext(RootstockContext);

  const [isActiveRr, setIsActiveRr] = useState(false);
  const [revenueAmount, setRevenueAmount] = useState(0);

  useEffect(() => {
    let interval;
    if (rrContract) {
      const queryRrContract = async () => {
        const isActive = await rrContract.isActive();
        if (isActive) {
          const revAmount = await rrContract.getRevenueAmount(address);
          setRevenueAmount(ethers.utils.formatEther(revAmount));
        }
        setIsActiveRr(isActive);
      };
      queryRrContract();
      setInterval(queryRrContract, SC_UPDATE_FREQUENCY);
    }
    return () => clearInterval(interval);
  }, [rrContract, address]);

  const verifyParams = async () => {
    // make sure a participant hasn't acquired his revenue yet
    if (await rrContract.revenueAquired())
      throw new Error('You have already acquired your revenue');
  };

  const acqureRevenue = async () => {
    try {
      await verifyParams();
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
      {isActiveRr ? (
        <>
          <Note>
            <h4>Acquire revenue</h4>
            <p>You can acquire your revenue now!</p>
            <p>{`Your revenue is ${revenueAmount} RBTC`}</p>
          </Note>
          <button type="button" onClick={acqureRevenue}>
            Acquire
          </button>
        </>
      ) : (
        <p>No active revenue redistribution</p>
      )}
    </Container>
  );
}

export default AcquireRevenue;
