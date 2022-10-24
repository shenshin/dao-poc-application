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
import ExecuteProposal from './components/ExecuteProposal';
import AcquireRevenue from './components/AcquireRevenue';
import { RouteNames } from './utils/constants';

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
