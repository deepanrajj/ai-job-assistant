import { useEffect, useRef, type FC } from 'react';

import { AppShellNavigation } from './AppShellNavigation';
import { useTranslation } from '../../../i18n';
import { navClassName } from '../appShell.utils';

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMobile();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = mobilePanelRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusable?.length) return;
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
      <aside
        aria-label={t('nav.main')}
        className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-app-border bg-app-surface px-3 py-4 transition-[width] lg:flex ${
          collapsed ? 'w-18' : 'w-60'
        }`}
      >
        <button
          aria-expanded={!collapsed}
          aria-label={t(collapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
          className={`mb-5 flex h-10 w-full items-center gap-2 rounded-lg border border-app-border text-app-textSoft hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
          onClick={onToggleCollapsed}
          type="button"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path
              d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
          {!collapsed && <span className="text-sm">{t('nav.collapseSidebar')}</span>}
        </button>
        <AppShellNavigation
          ariaLabel={t('nav.main')}
          className="space-y-1"
          collapsed={collapsed}
          linkClassName={({ isActive }) => navClassName({ collapsed, isActive })}
        />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden">
          <button
            aria-label={t('nav.closeMenu')}
            className="fixed inset-0 z-30 bg-app-text/30"
            onClick={onCloseMobile}
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
            <div className="mb-4 flex justify-end">
              <button
                aria-label={t('nav.closeMenu')}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-app-textSoft hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                onClick={onCloseMobile}
                ref={closeButtonRef}
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M5 5 19 19M19 5 5 19"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>
            <AppShellNavigation
              ariaLabel={t('nav.mobile')}
              className="space-y-1"
              linkClassName={navClassName}
              onNavigate={onCloseMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
};
