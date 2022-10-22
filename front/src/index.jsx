import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import EthersProvider from './components/EthersProvider';
import ProposalProvider from './components/ProposalProvider';
import GlobalStyles from './styles/global';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <EthersProvider>
      <ProposalProvider>
        <App />
      </ProposalProvider>
    </EthersProvider>
  </React.StrictMode>,
);
