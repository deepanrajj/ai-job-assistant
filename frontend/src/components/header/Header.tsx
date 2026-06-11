import type { FC } from 'react';

import { HeaderBriefcaseIcon } from './header.icons';

/**
 * Renders the standalone branded header for the job assistant.
 *
 * @returns {JSX.Element} Header with logo, title, and subtitle.
 */
export const Header: FC = () => (
  <header className="border-b border-app-border bg-app-bg">
    <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
        <HeaderBriefcaseIcon />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-app-text">
          AI Job Description Assistant
        </h1>
        <p className="mt-1 text-sm text-app-textMuted">
          Paste a job description, analyze it with AI, and prepare smarter.
        </p>
      </div>
    </div>
  </header>
);
