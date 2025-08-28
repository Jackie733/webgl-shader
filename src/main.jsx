import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FocusStyleManager } from '@blueprintjs/core';
import App from './App.jsx';
import './index.css';

FocusStyleManager.onlyShowFocusOnTabs();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
