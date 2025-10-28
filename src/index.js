import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initObservability } from './lib/observability';

// Inicializar observabilidad antes de renderizar la app
initObservability();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
