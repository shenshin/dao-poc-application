import { useContext } from 'react';
import styled from 'styled-components';
import EthersContext from './contexts/ethersContext';
import ConnectWallet from './components/ConnectWallet';
import Dashboard from './components/Dashboard';
import MessageBox from './components/MessageBox';

const Container = styled.div``;

function App() {
  const { account } = useContext(EthersContext);
  if (!account) {
    return <ConnectWallet />;
  }
  return (
    <Container>
      <Dashboard />
      <MessageBox />
    </Container>
  );
}

export default App;
