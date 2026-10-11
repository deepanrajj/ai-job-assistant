import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router-dom';

import { AppShellHeader, AppShellPageHeading, AppShellSidebar } from './layout';
import { useBreakpoint } from '../../hooks';
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
  // The drawer belongs to the route it was opened on, so any route change closes it.
  const [mobileMenuPathname, setMobileMenuPathname] = useState<string | null>(null);
  const isDesktop = useBreakpoint('lg');
  const mobileMenuOpen = !isDesktop && mobileMenuPathname === pathname;
  // Forget a menu left behind by Back/Forward or a resize to desktop, or it would reopen later.
  if (mobileMenuPathname !== null && !mobileMenuOpen) setMobileMenuPathname(null);
  const mainRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const restoreMenuFocusRef = useRef(false);
  const closeMobileMenu = useCallback(() => {
    restoreMenuFocusRef.current = true;
    setMobileMenuPathname(null);
  }, []);

  // The header is inert while the drawer is open, so focus returns only after it re-renders.
  useEffect(() => {
    if (mobileMenuOpen || !restoreMenuFocusRef.current) return;
    restoreMenuFocusRef.current = false;
    menuButtonRef.current?.focus();
  }, [mobileMenuOpen]);

  // Declared after the menu focus effect so a route change wins over returning to the menu button.
  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    restoreMenuFocusRef.current = false;
    document.documentElement.scrollTop = 0;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      {/* Keep the skip link first so keyboard users can bypass persistent navigation. */}
      <a
        className="sr-only z-50 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
        inert={mobileMenuOpen}
      >
        {t('a11y.skipToContent')}
      </a>
      <AppShellHeader
        inert={mobileMenuOpen}
        menuButtonRef={menuButtonRef}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() =>
          setMobileMenuPathname((openPathname) => (openPathname === pathname ? null : pathname))
        }
      />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AppShellSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={closeMobileMenu}
          onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8" inert={mobileMenuOpen}>
          <div className="mx-auto w-full max-w-7xl">
            {/* The id and aria-labelledby connect the skip link, page title, and route outlet. */}
            <main
              aria-labelledby="page-title"
              className="pb-8"
              id="main-content"
              ref={mainRef}
              tabIndex={-1}
            >
              <AppShellPageHeading page={page} />
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
