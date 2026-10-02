import { useMemo, type FC } from 'react';

import { Button, ErrorState, LoadingState } from '../../components/ui';
import { DashboardMetrics } from '../../features/dashboard/components/DashboardMetrics';
import { DashboardNextReminders } from '../../features/dashboard/components/DashboardNextReminders';
import { DashboardRecentActivity } from '../../features/dashboard/components/DashboardRecentActivity';
import { DashboardStatusOverview } from '../../features/dashboard/components/DashboardStatusOverview';
import type { INextRemindersState } from '../../features/dashboard/useNextReminders';
import { useTranslation } from '../../i18n';
import { getDashboardData } from '../../features/dashboard/dashboard.utils';
import type { AppError } from '../../errors';
import type { TJob } from '../../types';

/**
 * Props used by the dashboard page.
 */
interface IDashboardPageProps {
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  /**
   * Loaded separately from `jobs`, so its own loading and error states
   * render inside the reminders card and never replace the page.
   */
  nextReminders: INextRemindersState;
  onRetry: () => void;
}

/**
 * Renders dashboard metrics, the next reminders, status distribution, and
 * recent job activity.
 *
 * @param {IDashboardPageProps} props Component props.
 * @returns {JSX.Element} Smart job tracker dashboard.
 */
export const DashboardPage: FC<IDashboardPageProps> = ({
  error,
  isLoading,
  jobs,
  nextReminders,
  onRetry,
}) => {
  const { t } = useTranslation();
  const { activeJobCount, recentJobs, statusCounts, totalJobCount } = useMemo(
    () => getDashboardData(jobs),
    [jobs],
  );

  if (isLoading) return <LoadingState label={t('dashboard.loading')} />;

  if (error)
    return (
      <ErrorState
        action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
        description={error.message}
        title={t('dashboard.loadErrorTitle')}
      />
    );

  return (
    <div className="space-y-6">
      <DashboardMetrics
        activeJobCount={activeJobCount}
        statusCounts={statusCounts}
        totalJobCount={totalJobCount}
      />

      <DashboardNextReminders
        error={nextReminders.error}
        isLoading={nextReminders.isLoading}
        jobs={jobs}
        onRetry={nextReminders.reload}
        reminders={nextReminders.reminders}
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DashboardStatusOverview statusCounts={statusCounts} totalJobCount={totalJobCount} />
        <DashboardRecentActivity jobs={recentJobs} />
      </div>
    </div>
  );
};
