import type { FC } from 'react';

import { DashboardPage } from '../../pages/dashboard/DashboardPage';
import { useNextReminders } from '../../features/dashboard/useNextReminders';
import { useStatusHistory } from '../../features/dashboard/useStatusHistory';
import { useJobsList } from '../../features/jobs';
import { REMINDERS_FEATURE_ENABLED } from '../../features/reminders/reminders.constants';

/**
 * Renders the dashboard with saved jobs, status history, and the next
 * reminders.
 *
 * The route owns the requests, as `jobsRoute` does, because `DashboardPage`
 * derives its metrics from the job list and owns no state of its own. That
 * keeps the page's cases free of MSW. The next reminders are a second,
 * independent request for the same reason, and so that its failure stays
 * on the reminders card.
 *
 * @returns {JSX.Element} Dashboard route content.
 */
export const DashboardRouteWithReminders: FC = () => {
  const { error, isLoading, jobs, reload } = useJobsList();
  const nextReminders = useNextReminders();
  const statusHistory = useStatusHistory();

  return (
    <DashboardPage
      error={error}
      isLoading={isLoading}
      jobs={jobs}
      nextReminders={nextReminders}
      onRetry={reload}
      statusHistory={statusHistory}
    />
  );
};

/**
 * Renders the dashboard without reminders, making no reminder request.
 * Status history still loads: the insights do not depend on reminders.
 *
 * @returns {JSX.Element} Dashboard route content.
 */
export const DashboardRouteWithoutReminders: FC = () => {
  const { error, isLoading, jobs, reload } = useJobsList();
  const statusHistory = useStatusHistory();

  return (
    <DashboardPage
      error={error}
      isLoading={isLoading}
      jobs={jobs}
      onRetry={reload}
      statusHistory={statusHistory}
    />
  );
};

/**
 * The dashboard route. Chosen once, at module load, rather than with a
 * condition inside one component, so each variant calls the same hooks on
 * every render. TEMPORARY: collapse back to `DashboardRouteWithReminders`
 * once the task 040 backend lands; see `REMINDERS_FEATURE_ENABLED`.
 */
export const Component: FC = REMINDERS_FEATURE_ENABLED
  ? DashboardRouteWithReminders
  : DashboardRouteWithoutReminders;
