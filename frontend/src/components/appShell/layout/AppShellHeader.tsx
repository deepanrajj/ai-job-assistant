import type { FC } from 'react';

import { LanguageSelect } from '../../languageSelect/LanguageSelect';
import { AppShellNavigation } from './AppShellNavigation';
import { useTranslation } from '../../../i18n';
import { mobileNavClassName } from '../appShell.utils';
import type { IAppRouteHandle } from '../../../routes/routes.types';

/**
 * Props used by the app shell header.
 */
interface IAppShellHeaderProps {
  page: IAppRouteHandle;
}

/**
 * Renders the sticky page header with title, app controls, and mobile navigation.
 *
 * @param {IAppShellHeaderProps} props Component props.
 * @param {IAppRouteHandle} props.page Translation keys for the current matched route.
 * @returns {JSX.Element} App shell header.
 */
export const AppShellHeader: FC<IAppShellHeaderProps> = ({ page }) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 border-b border-app-border bg-app-surface/95 backdrop-blur">
      <div className="flex min-h-16 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-app-text" id="page-title">
              {t(page.title)}
            </h1>
            <p className="mt-1 text-sm text-app-textMuted">{t(page.subtitle)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-app-border bg-app-surface2 px-3 py-2 text-sm text-app-textSoft sm:flex">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success-500" />
              {t('app.localMockData')}
            </div>
            <LanguageSelect />
          </div>
        </div>

        {/* Reuse the same nav config as the sidebar, with compact mobile styling. */}
        <AppShellNavigation
          ariaLabel={t('nav.mobile')}
          className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
          linkClassName={mobileNavClassName}
        />
      </div>
    </header>
  );
};
