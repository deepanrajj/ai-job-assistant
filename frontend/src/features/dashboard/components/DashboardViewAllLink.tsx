import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from '../../../i18n';
import { APP_PATHS } from '../../../routes/paths';

/**
 * Renders the "View all" link in a dashboard card header, leading to the
 * jobs list. Every such link goes to the same page, so they can share the
 * same name.
 *
 * @returns {JSX.Element} Link to the jobs list.
 */
export const DashboardViewAllLink: FC = () => {
  const { t } = useTranslation();

  return (
    <Link
      className="shrink-0 rounded-md text-sm font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      to={APP_PATHS.JOBS}
    >
      {t('dashboard.viewAll')}
    </Link>
  );
};
