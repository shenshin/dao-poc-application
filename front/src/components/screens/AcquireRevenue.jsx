import { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import RootstockContext from '../../contexts/rootstockContext';
import Container from '../../styles/container';
import Note from '../../styles/note';
import {
  ERROR_CODE_TX_REJECTED_BY_USER,
  RouteNames,
} from '../../utils/constants';

function AcquireRevenue() {
  const navigate = useNavigate();
  const { address, rrContract, setErrorMessage, setLoading } =
    useContext(RootstockContext);

  const [isActiveRr, setIsActiveRr] = useState(true);
  const [revenueAmount, setRevenueAmount] = useState(0);
  const [hasAcquired, setHasAcquired] = useState(false);

  useEffect(() => {
    if (rrContract) {
      const queryRrContract = async () => {
        const isActive = await rrContract.isActive();
        if (isActive) {
          const revAmount = await rrContract.getRevenueAmount(address);
          setRevenueAmount(ethers.utils.formatEther(revAmount));
          setHasAcquired(await rrContract.revenueAquired());
        }
        setIsActiveRr(isActive);
      };
      queryRrContract();
    }
  }, [rrContract, address]);

  const acqureRevenue = async () => {
    try {
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
            {!hasAcquired && <p>You can acquire your revenue now!</p>}
            <p>{`Your revenue is ${revenueAmount} RBTC`}</p>
          </Note>
          {hasAcquired ? (
            <p>You have already acquired your revenue</p>
          ) : (
            <button type="button" onClick={acqureRevenue}>
              Acquire
            </button>
          )}
        </>
      ) : (
        <p>No active revenue redistribution</p>
      )}
    </Container>
  );
}

export default AcquireRevenue;
