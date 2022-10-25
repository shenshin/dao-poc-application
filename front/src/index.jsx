import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import EthersProvider from './components/providers/EthersProvider';
import ProposalProvider from './components/providers/ProposalProvider';
import GlobalStyles from './styles/global';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <BrowserRouter>
      <EthersProvider>
        <ProposalProvider>
          <App />
        </ProposalProvider>
      </EthersProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
