import { useEffect, useRef, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { getButtonClassName } from '../../ui';
import { LanguageSelect } from '../../languageSelect/LanguageSelect';
import { AppShellNavigation } from './AppShellNavigation';
import { PlusIcon } from '../../icons';
import { ChevronIcon, CloseIcon } from '../appShell.icons';
import { useTranslation } from '../../../i18n';
import { isDisplayed, navClassName } from '../appShell.utils';
import { APP_PATHS } from '../../../routes/paths';

/**
 * Props for the responsive sidebar and its compact-screen drawer.
 */
interface IAppShellSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

/**
 * Renders desktop navigation with an icon-only mode and a small-screen drawer.
 *
 * @param {IAppShellSidebarProps} props Sidebar state and callbacks.
 * @returns {JSX.Element} Responsive sidebar navigation.
 */
export const AppShellSidebar: FC<IAppShellSidebarProps> = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobile();
        return;
      }
      if (event.key !== 'Tab') return;

      // Phone-only drawer actions are display:none on wider screens, so skip hidden controls.
      const panel = mobilePanelRef.current;
      const focusable = Array.from(
        panel?.querySelectorAll<HTMLElement>('button, a[href]') ?? [],
      ).filter((element) => panel && isDisplayed(element, panel));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <div
        className={`sticky top-16 z-10 hidden h-[calc(100vh-4rem)] shrink-0 flex-col overflow-y-auto border-r border-app-border bg-app-surface px-3 py-4 transition-[width] lg:flex ${
          collapsed ? 'w-18' : 'w-60'
        }`}
      >
        <button
          aria-controls="desktop-nav"
          aria-expanded={!collapsed}
          aria-label={t(collapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
          className={`mb-5 flex h-10 w-full items-center gap-2 rounded-lg border border-app-border text-app-textSoft hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
          onClick={onToggleCollapsed}
          type="button"
        >
          <ChevronIcon direction={collapsed ? 'right' : 'left'} />
          {!collapsed && <span className="text-sm">{t('nav.collapseSidebar')}</span>}
        </button>
        <AppShellNavigation
          ariaLabel={t('nav.main')}
          className="space-y-1"
          collapsed={collapsed}
          id="desktop-nav"
          linkClassName={({ isActive }) => navClassName({ collapsed, isActive })}
        />
      </div>

      {mobileOpen && (
        <div className="lg:hidden">
          {/* Pointer-only backdrop; keyboard users close the drawer with its button or Escape. */}
          <button
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-app-text/30"
            onClick={onCloseMobile}
            tabIndex={-1}
            type="button"
          />
          <aside
            aria-label={t('nav.mobile')}
            aria-modal="true"
            className="fixed bottom-0 left-0 top-0 z-40 w-64 overflow-y-auto border-r border-app-border bg-app-surface p-4 shadow-xl"
            id="mobile-nav-panel"
            ref={mobilePanelRef}
            role="dialog"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="sm:hidden">
                <LanguageSelect />
              </div>
              <button
                aria-label={t('nav.closeMenu')}
                className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-app-textSoft hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                onClick={onCloseMobile}
                ref={closeButtonRef}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
            {pathname !== APP_PATHS.JOB_NEW && (
              <div className="mb-4 border-b border-app-border pb-4 sm:hidden">
                {/* Leaving the route closes the drawer, so the link needs no close handler. */}
                <Link
                  className={getButtonClassName({
                    className: 'whitespace-nowrap',
                    fullWidth: true,
                  })}
                  to={APP_PATHS.JOB_NEW}
                >
                  <PlusIcon />
                  {t('jobs.addJob')}
                </Link>
              </div>
            )}
            {/* The dialog already carries the name, so the nav inside it stays unlabelled. */}
            <AppShellNavigation
              className="space-y-1"
              linkClassName={navClassName}
              // Other routes close the drawer on their own; the current one has to close it here.
              onNavigate={(path) => {
                if (path === pathname) onCloseMobile();
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
};
