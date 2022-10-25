import { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  const { address, rrContract, isActiveRr, setErrorMessage, setLoading } =
    useContext(EthersContext);

  const [revenueAmount, setRevenueAmount] = useState(0);
  const [isAcquired, setIsAcquired] = useState(false);
  useEffect(() => {
    (async () => {
      if (isActiveRr) {
        const revAmount = await rrContract.getRevenueAmount(address);
        const revAcquired = await rrContract.revenueAquired();
        setRevenueAmount(ethers.utils.parseEther(revAmount));
        setIsAcquired(revAcquired);
      } else {
        setRevenueAmount(0);
        setIsAcquired(false);
      }
    })();
  }, [isActiveRr, rrContract, address]);

  const acqureRevenue = async () => {
    try {
      if (isAcquired) throw new Error('You have already acquired your revenue');
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
        {isActiveRr ? (
          <>
            {isAcquired ? (
              <p>You have already acquired your revenue</p>
            ) : (
              <>
                <p>You can acquire your revenue now!</p>
                <p>{`Your revenue is ${revenueAmount}`}</p>
              </>
            )}
            <p>Revenue redistribution is now active</p>
          </>
        ) : (
          <p>No active revenue redistribution</p>
        )}
      </Note>
      {isActiveRr && (
        <button type="button" onClick={acqureRevenue}>
          Acquire
        </button>
      )}
    </Container>
  );
}

export default AcquireRevenue;
