import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router-dom';

import { AppShellHeader, AppShellPageHeading, AppShellSidebar } from './layout';
import { useTranslation } from '../../i18n';
import { getActiveRouteHandle } from '../../routes/routes.utils';

/**
 * Renders the persistent application shell with navigation, page header, and route outlet.
 *
 * @returns {JSX.Element} Responsive layout shell for the app routes.
 */
export const AppShell: FC = () => {
  const matches = useMatches();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const page = getActiveRouteHandle(matches);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      {/* Keep the skip link first so keyboard users can bypass persistent navigation. */}
      <a
        className="sr-only z-50 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        {t('a11y.skipToContent')}
      </a>
      <AppShellHeader
        menuButtonRef={menuButtonRef}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
      />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AppShellSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={closeMobileMenu}
          onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <AppShellPageHeading page={page} />
            {/* The id and aria-labelledby connect the skip link, page title, and route outlet. */}
            <main
              aria-labelledby="page-title"
              className="pb-8"
              id="main-content"
              ref={mainRef}
              tabIndex={-1}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
