import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/win95.css';

console.log('React app starting...');
console.log('Global defined:', typeof global !== 'undefined');
console.log('Window defined:', typeof window !== 'undefined');

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);