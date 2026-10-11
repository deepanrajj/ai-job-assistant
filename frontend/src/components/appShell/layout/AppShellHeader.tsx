import type { FC, RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { LanguageSelect } from '../../languageSelect/LanguageSelect';
import { PlusIcon } from '../../icons';
import { AppLogoIcon, ProfileIcon } from '../appShell.icons';
import { useTranslation } from '../../../i18n';
import { APP_PATHS } from '../../../routes/paths';

/**
 * Props used by the app shell header.
 */
interface IAppShellHeaderProps {
  inert?: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

/**
 * Renders the brand and route controls above the sidebar and page heading.
 *
 * @param {IAppShellHeaderProps} props Header state and route metadata.
 * @returns {JSX.Element} App shell header.
 */
export const AppShellHeader: FC<IAppShellHeaderProps> = ({
  inert = false,
  menuButtonRef,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <header
      className="sticky top-0 z-20 h-16 border-b border-app-border bg-app-surface/95 backdrop-blur"
      inert={inert}
    >
      <div className="flex h-full items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            aria-controls="mobile-nav-panel"
            aria-expanded={mobileMenuOpen}
            aria-label={t('nav.openMenu')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-app-textSoft hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 lg:hidden"
            onClick={onToggleMobileMenu}
            ref={menuButtonRef}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
          <Link
            aria-label={t('app.name')}
            className="flex min-w-0 items-center gap-2 rounded-lg text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            to={APP_PATHS.DASHBOARD}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
              <AppLogoIcon />
            </span>
            <span className="hidden truncate font-display text-[15px] font-semibold tracking-tight text-app-text sm:inline">
              {t('app.name')}
            </span>
          </Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {pathname !== APP_PATHS.JOB_NEW && (
            <Link
              className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary-600 px-4 text-sm font-medium text-white transition hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:inline-flex"
              to={APP_PATHS.JOB_NEW}
            >
              <PlusIcon />
              {t('jobs.addJob')}
            </Link>
          )}
          <div className="hidden sm:block">
            <LanguageSelect />
          </div>
          <Link
            aria-label={t('nav.profile')}
            className="flex h-10 items-center gap-2 rounded-full border border-app-border bg-app-surface2 px-2 text-app-textSoft hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:px-3"
            to={APP_PATHS.PROFILE}
          >
            <ProfileIcon />
            <span className="hidden text-sm font-medium md:inline">{t('nav.profile')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
