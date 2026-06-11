import { memo, type FC } from 'react';

import { Card } from '../../ui';
import { useTranslation } from '../../../i18n';
import { formatDashboardDate } from '../dashboard.utils';
import type { TJob } from '../../../types';

/**
 * Props used by the dashboard recent activity list.
 */
interface IDashboardRecentActivityProps {
  jobs: TJob[];
}

/**
 * Renders the most recently updated jobs.
 *
 * @param {IDashboardRecentActivityProps} props Component props.
 * @returns {JSX.Element} Dashboard recent activity list.
 */
const DashboardRecentActivityComponent: FC<IDashboardRecentActivityProps> = ({ jobs }) => {
  const { language, t } = useTranslation();

  return (
    <Card bodyClassName="p-0" padding="none" title={t('dashboard.recentActivity')}>
      <ul className="divide-y divide-app-border">
        {jobs.map((job) => (
          <li
            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            key={job.id}
          >
            <div>
              <p className="font-medium text-app-text">{job.company}</p>
              <p className="text-sm text-app-textMuted">{job.roleTitle}</p>
            </div>
            <p className="text-sm text-app-textSoft">
              {t('dashboard.updated', {
                date: formatDashboardDate(job.updatedAt, language),
              })}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const DashboardRecentActivity = memo(DashboardRecentActivityComponent);
