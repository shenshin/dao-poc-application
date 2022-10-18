import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import EthersProvider from './components/EthersProvider';
import GlobalStyles from './styles/global';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <EthersProvider>
      <App />
    </EthersProvider>
  </React.StrictMode>,
);
