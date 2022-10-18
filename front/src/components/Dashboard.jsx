import { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import EthersContext from '../contexts/ethersContext';
import RifContext from '../contexts/rifContext';
import VoteTokenContext from '../contexts/voteTokenContext';
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
  const { account, provider, setNetworkError } = useContext(EthersContext);
  const { rifBalance } = useContext(RifContext);
  const { voteTokenBalance } = useContext(VoteTokenContext);

  const [balance, setBalance] = useState(0);
  useEffect(() => {
    let interval;
    if (account) {
      const getBalance = async () => {
        try {
          setNetworkError(null);
          setBalance(await provider.getBalance(account));
        } catch (error) {
          setNetworkError(error.message);
        }
      };
      getBalance();
      interval = setInterval(getBalance, SC_UPDATE_FREQUENCY);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, provider]);
  return (
    <Container>
      <Block>
        <h3>Account</h3>
        <p>{`Address: ${account}`}</p>
        <p>{`Balance: ${balance}`}</p>
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
