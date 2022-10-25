import { useContext } from 'react';
import styled from 'styled-components';
import EthersContext from '../contexts/ethersContext';
import ProposalContext from '../contexts/proposalContext';
import useRbtcBalance from '../hooks/useRbtcBalance';

const Container = styled.div`
  padding: 0.5rem;
  border: 1px solid white;
`;
const Row = styled.div`
  width: 100%;
  display: flex;
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
    voteTotalSupply,
    rrContract,
  } = useContext(EthersContext);

  const { proposals } = useContext(ProposalContext);

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
      <Row>
        <Block>
          <h3>Account</h3>
          <p>{`Address: ${address ?? 'Connect your wallet'}`}</p>
          <p>{`Balance: ${userRbtcBalance} RBTC`}</p>
        </Block>
        <Block>
          <h3>Tokens</h3>
          <p>{`RIF balance: ${rifBalance} RIFs`}</p>
          <p>{`Vote token balance: ${voteTokenBalance} Vote tokens`}</p>
          <p>{`Vote token total supply: ${voteTotalSupply} Vote tokens`}</p>
        </Block>
      </Row>
      <Row>
        <Block>
          <h3>Rootstock treasury</h3>
          <p>{`Treasury size: ${treasuryRbtcBalance} RBTC`}</p>
        </Block>
        <Block>
          <h3>Active proposals</h3>
          {proposals.length === 0 ? (
            <p>No active proposals</p>
          ) : (
            proposals.map(({ description }) => (
              <p key={description}>{description}</p>
            ))
          )}
        </Block>
      </Row>
    </Container>
  );
}

export default Dashboard;
