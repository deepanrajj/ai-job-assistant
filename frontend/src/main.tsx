import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';

import App from './App.tsx';
import { TranslationProvider } from './i18n';
import { clearLegacyJobStorage } from './utils';
import './index.css';

clearLegacyJobStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </StrictMode>,
);
