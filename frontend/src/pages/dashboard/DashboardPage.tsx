import { useMemo, type FC } from 'react';

import { DashboardMetrics } from '../../components/dashboard/sections/DashboardMetrics';
import { DashboardRecentActivity } from '../../components/dashboard/sections/DashboardRecentActivity';
import { DashboardStatusOverview } from '../../components/dashboard/sections/DashboardStatusOverview';
import { getDashboardData } from '../../components/dashboard/dashboard.utils';
import type { TJob } from '../../types';

/**
 * Props used by the dashboard page.
 */
interface IDashboardPageProps {
  jobs: TJob[];
}

/**
 * Renders dashboard metrics, status distribution, and recent job activity.
 *
 * @param {IDashboardPageProps} props Component props.
 * @returns {JSX.Element} Smart job tracker dashboard.
 */
export const DashboardPage: FC<IDashboardPageProps> = ({ jobs }) => {
  const { activeJobCount, recentJobs, statusCounts, totalJobCount } = useMemo(
    () => getDashboardData(jobs),
    [jobs],
  );

  return (
    <div className="space-y-6">
      <DashboardMetrics
        activeJobCount={activeJobCount}
        statusCounts={statusCounts}
        totalJobCount={totalJobCount}
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DashboardStatusOverview statusCounts={statusCounts} totalJobCount={totalJobCount} />
        <DashboardRecentActivity jobs={recentJobs} />
      </div>
    </div>
  );
};
