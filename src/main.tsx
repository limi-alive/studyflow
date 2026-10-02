import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';
import './mobile-final-v12.css';
import './companion.css';
import './focus-v11.css';
import './auth-reward-v12.css';

import './theme-responsive.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><HashRouter><App/></HashRouter></React.StrictMode>
);
