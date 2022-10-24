import { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import EthersContext from './contexts/ethersContext';
import { RouteNames } from './utils/constants';
// components
import ConnectWallet from './components/ConnectWallet';
import Dashboard from './components/Dashboard';
import MessageBox from './components/MessageBox';
import Navigation from './components/Navigation';
// screens
import Enfranchisement from './components/screens/Enfranchisement';
import CreateRrProposal from './components/screens/CreateRrProposal';
import Voting from './components/screens/Voting';
import ExecuteProposal from './components/screens/ExecuteProposal';
import AcquireRevenue from './components/screens/AcquireRevenue';
import UnwrapTokens from './components/screens/UnwrapTokens';

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
        <Route
          path="*"
          element={<Navigate to={RouteNames.enfranchisement} />}
        />
        <Route
          path={RouteNames.enfranchisement}
          element={<Enfranchisement />}
        />
        <Route
          path={RouteNames.createRrProposal}
          element={<CreateRrProposal />}
        />
        <Route path={RouteNames.unwrapTokens} element={<UnwrapTokens />} />
        <Route path={RouteNames.voteForProposal} element={<Voting />} />
        <Route
          path={RouteNames.executeProposal}
          element={<ExecuteProposal />}
        />
        <Route path={RouteNames.acquireRevenue} element={<AcquireRevenue />} />
      </Routes>
      <MessageBox />
    </Navigation>
  );
}

export default App;
