import type { FC } from 'react';

import { AppShellNavigation } from './AppShellNavigation';
import { AppLogoIcon } from '../appShell.icons';
import { useTranslation } from '../../../i18n';
import { navClassName } from '../appShell.utils';

/**
 * Renders the desktop sidebar with brand and primary navigation.
 *
 * @returns {JSX.Element} Desktop app sidebar.
 */
export const AppShellSidebar: FC = () => {
  const { t } = useTranslation();

  return (
    <aside
      aria-label={t('app.name')}
      className="hidden w-68 shrink-0 border-r border-app-border bg-app-surface px-4 py-5 lg:block"
    >
      {/* The brand is sidebar-only; mobile keeps the header focused on page context. */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
          <AppLogoIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-app-text">{t('app.name')}</p>
          <p className="text-xs text-app-textMuted">{t('app.stage')}</p>
        </div>
      </div>

      <AppShellNavigation
        ariaLabel={t('nav.main')}
        className="space-y-1"
        linkClassName={navClassName}
      />
    </aside>
  );
};
