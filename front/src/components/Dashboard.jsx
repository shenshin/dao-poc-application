import { useContext } from 'react';
import styled from 'styled-components';
import EthersContext from '../contexts/ethersContext';
import useRbtcBalance from '../hooks/useRbtcBalance';

const Container = styled.div`
  padding: 0.5rem;
  border: 1px solid white;
`;
const UserDashboard = styled.div`
  width: 100%;
  display: flex;
`;
const TreasuryDashboard = styled.div`
  padding: 0.5rem;
`;
const Block = styled.div`
  padding: 0.5rem;
  flex-basis: 50%;
`;

function Dashboard() {
  const {
    address,
    provider,
    setErrorMessage,
    rifBalance,
    voteTokenBalance,
    rrContract,
  } = useContext(EthersContext);

  const userRbtcBalance = useRbtcBalance({
    address,
    provider,
    setErrorMessage,
  });
  const treasuryRbtcBalance = useRbtcBalance({
    address: rrContract?.address,
    provider,
    setErrorMessage,
  });
  return (
    <Container>
      <UserDashboard>
        <Block>
          <h3>Account</h3>
          <p>{`Address: ${address}`}</p>
          <p>{`Balance: ${userRbtcBalance} RBTC`}</p>
        </Block>
        <Block>
          <h3>Tokens</h3>
          <p>{`RIF balance: ${rifBalance} RIFs`}</p>
          <p>{`Vote token balance: ${voteTokenBalance} Vote tokens`}</p>
        </Block>
      </UserDashboard>
      <TreasuryDashboard>
        <h3>Rootstock treasury</h3>
        <p>{`Treasury size: ${treasuryRbtcBalance} RBTC`}</p>
      </TreasuryDashboard>
    </Container>
  );
}

export default Dashboard;
