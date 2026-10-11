import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Outlet, useLocation, useMatches, useNavigationType } from 'react-router-dom';

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
  const isDesktop = useBreakpoint('lg');
  const navigationType = useNavigationType();
  // The drawer belongs to the route it was opened on: leaving that route or widening to desktop
  // closes it in the same render, so a route change never races a separate close.
  const [mobileMenuPathname, setMobileMenuPathname] = useState<string | null>(null);
  const mobileMenuOpen = !isDesktop && mobileMenuPathname === pathname;
  // Forget a closed drawer's route, or Back/Forward to it would reopen the drawer.
  if (mobileMenuPathname !== null && !mobileMenuOpen) setMobileMenuPathname(null);
  const mainRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousRef = useRef({ mobileMenuOpen, pathname });
  const closeMobileMenu = useCallback(() => setMobileMenuPathname(null), []);

  // One effect owns focus: a route change moves focus to the page, while closing the drawer on
  // the same route returns focus to the menu button once the header is no longer inert.
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { mobileMenuOpen, pathname };

    if (previous.pathname !== pathname) {
      // Back/Forward (POP) keeps the scroll position the browser restored.
      if (navigationType !== 'POP') document.documentElement.scrollTop = 0;
      mainRef.current?.focus({ preventScroll: true });
    } else if (previous.mobileMenuOpen && !mobileMenuOpen && !isDesktop) {
      menuButtonRef.current?.focus();
    }
  }, [isDesktop, mobileMenuOpen, navigationType, pathname]);

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
              className="pb-8 focus:outline-none"
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
