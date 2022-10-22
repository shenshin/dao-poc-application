import { useContext } from 'react';
import styled from 'styled-components';
import EthersContext from './contexts/ethersContext';
import ConnectWallet from './components/ConnectWallet';
import Dashboard from './components/Dashboard';
import MessageBox from './components/MessageBox';
import WrapTokens from './components/WrapTokens';
import UnwrapTokens from './components/UnwrapTokens';
import CreateRrProposal from './components/CreateRrProposal';

const Container = styled.div``;

function App() {
  const { address } = useContext(EthersContext);
  if (!address) {
    return <ConnectWallet />;
  }
  return (
    <Container>
      <Dashboard />
      <WrapTokens />
      <CreateRrProposal />
      <UnwrapTokens />
      <MessageBox />
    </Container>
  );
}

export default App;
