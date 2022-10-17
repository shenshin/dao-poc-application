import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import EthersProvider from './contexts/EthersProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <EthersProvider>
      <App />
    </EthersProvider>
  </React.StrictMode>,
);
