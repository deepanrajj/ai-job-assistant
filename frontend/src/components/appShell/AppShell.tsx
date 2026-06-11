import type { FC } from 'react';
import { Outlet, useMatches } from 'react-router-dom';

import { AppShellHeader, AppShellSidebar } from './layout';
import { useTranslation } from '../../i18n';
import { getActiveRouteHandle } from '../../routes/routes.utils';

/**
 * Renders the persistent application shell with navigation, page header, and route outlet.
 *
 * @returns {JSX.Element} Responsive layout shell for the app routes.
 */
export const AppShell: FC = () => {
  const matches = useMatches();
  const { t } = useTranslation();
  const page = getActiveRouteHandle(matches);

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      {/* Keep the skip link first so keyboard users can bypass persistent navigation. */}
      <a
        className="sr-only z-50 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        {t('a11y.skipToContent')}
      </a>
      <div className="flex min-h-screen">
        <AppShellSidebar />

        <div className="min-w-0 flex-1">
          <AppShellHeader page={page} />
          {/* The id and aria-labelledby connect the skip link, page title, and route outlet. */}
          <main
            aria-labelledby="page-title"
            className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
            id="main-content"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
