import { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import EthersContext from '../contexts/ethersContext';
import { SC_UPDATE_FREQUENCY } from '../utils/constants';

const Container = styled.div`
  width: 100%;
  display: flex;
  gap: 0.2rem;
`;
const Block = styled.div`
  padding: 0.5rem;
  flex-basis: 50%;
  border: 1px solid white;
`;

function Dashboard() {
  const { address, provider, setErrorMessage, rifBalance, voteTokenBalance } =
    useContext(EthersContext);

  const [balance, setBalance] = useState(0);
  useEffect(() => {
    let interval;
    if (address) {
      const getBalance = async () => {
        try {
          setErrorMessage(null);
          const weiBalance = await provider.getBalance(address);
          setBalance(ethers.utils.formatEther(weiBalance));
        } catch (error) {
          setErrorMessage(error.message);
        }
      };
      getBalance();
      interval = setInterval(getBalance, SC_UPDATE_FREQUENCY);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, provider]);
  return (
    <Container>
      <Block>
        <h3>Account</h3>
        <p>{`Address: ${address}`}</p>
        <p>{`Balance: ${balance} RBTC`}</p>
      </Block>
      <Block>
        <h3>Tokens</h3>
        <p>{`RIF balance: ${rifBalance}`}</p>
        <p>{`Vote token balance: ${voteTokenBalance}`}</p>
      </Block>
    </Container>
  );
}

export default Dashboard;
