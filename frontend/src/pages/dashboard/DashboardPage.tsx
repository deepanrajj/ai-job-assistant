import { useMemo, type FC } from 'react';

import { Button, ErrorState, LoadingState } from '../../components/ui';
import { DashboardInsights } from '../../features/dashboard/components/DashboardInsights';
import { DashboardNextReminders } from '../../features/dashboard/components/DashboardNextReminders';
import { DashboardRecentActivity } from '../../features/dashboard/components/DashboardRecentActivity';
import { DashboardStatusOverview } from '../../features/dashboard/components/DashboardStatusOverview';
import type { INextRemindersState } from '../../features/dashboard/useNextReminders';
import type { IStatusHistoryState } from '../../features/dashboard/useStatusHistory';
import { useTranslation } from '../../i18n';
import { getDashboardData } from '../../features/dashboard/dashboard.utils';
import { getApplicationHistory } from '../../features/dashboard/dashboardInsights.utils';
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
   * render inside the reminders card and never replace the page. Omitted
   * while the reminders feature is switched off, which leaves the card
   * out entirely.
   */
  nextReminders?: INextRemindersState;
  onRetry: () => void;
  /**
   * Loaded separately from `jobs`, so its loading and error states stay
   * inside the insights section and never hide the job counts.
   */
  statusHistory: IStatusHistoryState;
}

/**
 * Renders the dashboard: job-search insights first, then the pipeline
 * beside the next reminders, then recent job activity. Without the
 * reminders feature the pipeline and recent activity share the middle row,
 * so no column is left empty.
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
  statusHistory,
}) => {
  const { t } = useTranslation();
  const { activeJobCount, recentJobs, statusCounts, totalJobCount } = useMemo(
    () => getDashboardData(jobs),
    [jobs],
  );
  // Derived once from a settled, complete history and shared by the insights
  // and recent activity. While the history loads or after it fails there is
  // none, so recent activity shows no dates rather than partial ones.
  const applicationHistory = useMemo(
    () =>
      statusHistory.events && !statusHistory.isLoading && !statusHistory.error
        ? getApplicationHistory(jobs, statusHistory.events)
        : null,
    [jobs, statusHistory.error, statusHistory.events, statusHistory.isLoading],
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

  // One element, placed beside the pipeline or below it.
  const recentActivity = (
    <DashboardRecentActivity applicationHistory={applicationHistory} jobs={recentJobs} />
  );

  return (
    <div className="space-y-6">
      <DashboardInsights
        applicationHistory={applicationHistory}
        error={statusHistory.error}
        events={statusHistory.events}
        isLoading={statusHistory.isLoading}
        jobs={jobs}
        onRetry={statusHistory.reload}
      />

      <div
        className={`grid gap-6 ${
          nextReminders ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]' : 'lg:grid-cols-2'
        }`}
      >
        <DashboardStatusOverview
          activeJobCount={activeJobCount}
          statusCounts={statusCounts}
          totalJobCount={totalJobCount}
        />
        {nextReminders ? (
          <DashboardNextReminders
            error={nextReminders.error}
            hasMore={nextReminders.hasMore}
            isLoading={nextReminders.isLoading}
            jobs={jobs}
            onRetry={nextReminders.reload}
            reminders={nextReminders.reminders}
          />
        ) : (
          recentActivity
        )}
      </div>

      {nextReminders && recentActivity}
    </div>
  );
};
