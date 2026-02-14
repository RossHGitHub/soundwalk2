import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'
import { PwaProvider } from './pwa/PwaProvider.tsx';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PwaProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PwaProvider>
  </React.StrictMode>
);
