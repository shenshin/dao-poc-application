import { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import ConnectWallet from './components/ConnectWallet';
import Dashboard from './components/Dashboard';
import MessageBox from './components/MessageBox';
import Enfranchisement from './components/Enfranchisement';
import UnwrapTokens from './components/UnwrapTokens';
import CreateRrProposal from './components/CreateRrProposal';
import Navigation from './components/Navigation';
import EthersContext from './contexts/ethersContext';
import Voting from './components/Voting';

function App() {
  const { address } = useContext(EthersContext);
  if (!address) {
    return (
      <Routes>
        <Route path="*" element={<ConnectWallet />} />
      </Routes>
    );
  }
  return (
    <Navigation>
      <Dashboard />
      <Routes>
        <Route path="*" element={<Navigate to="/enfranchisement" />} />
        <Route path="/enfranchisement" element={<Enfranchisement />} />
        <Route path="/create-proposal" element={<CreateRrProposal />} />
        <Route path="/unwrap" element={<UnwrapTokens />} />
        <Route path="/vote" element={<Voting />} />
      </Routes>
      <MessageBox />
    </Navigation>
  );
}

export default App;
