import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/firebase'; // Trigger connection test
import { surviveTranslatedDom } from './lib/translatedDom';

// Before React mounts: a translated page must not be able to unmount the app.
surviveTranslatedDom();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
