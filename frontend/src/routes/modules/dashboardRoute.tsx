import type { FC } from 'react';

import { DashboardPage } from '../../pages/dashboard/DashboardPage';
import { useJobsList } from '../../features/jobs';

/**
 * Renders the dashboard route with saved jobs loaded from the backend.
 *
 * The route owns the request, as `jobsRoute` does, because `DashboardPage`
 * derives its metrics from the job list and owns no state of its own. That
 * keeps the page's cases free of MSW.
 *
 * @returns {JSX.Element} Dashboard route content.
 */
export const Component: FC = () => {
  const { error, isLoading, jobs, reload } = useJobsList();

  return <DashboardPage error={error} isLoading={isLoading} jobs={jobs} onRetry={reload} />;
};
