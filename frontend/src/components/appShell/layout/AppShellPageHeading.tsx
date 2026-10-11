import type { FC } from 'react';

import { useTranslation } from '../../../i18n';
import type { IAppRouteHandle } from '../../../routes/routes.types';

/**
 * Props for the heading shared by all app routes.
 */
interface IAppShellPageHeadingProps {
  page: IAppRouteHandle;
}

/**
 * Renders the route title and subtitle in the content column.
 *
 * @param {IAppShellPageHeadingProps} props Current route metadata.
 * @returns {JSX.Element} Page heading.
 */
export const AppShellPageHeading: FC<IAppShellPageHeadingProps> = ({ page }) => {
  const { t } = useTranslation();

  return (
    <div className="pb-5 pt-6">
      <h1
        className="font-display text-3xl font-semibold tracking-tight text-app-text sm:text-4xl"
        id="page-title"
      >
        {t(page.title)}
      </h1>
      <p className="mt-1 text-sm text-app-textMuted">{t(page.subtitle)}</p>
    </div>
  );
};
