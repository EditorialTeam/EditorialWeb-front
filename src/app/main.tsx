import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '@/styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/image-cache.js').catch(() => { /* Images still load without caching. */ });
  });
}
