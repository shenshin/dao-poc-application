import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import RootstockProvider from './components/providers/RootstockProvider';
import ProposalProvider from './components/providers/ProposalProvider';
import GlobalStyles from './styles/global';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <BrowserRouter>
      <RootstockProvider>
        <ProposalProvider>
          <App />
        </ProposalProvider>
      </RootstockProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
