import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { JobsProvider } from './features/jobs';
import { TranslationProvider } from './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider>
      <JobsProvider>
        <App />
      </JobsProvider>
    </TranslationProvider>
  </StrictMode>,
);
