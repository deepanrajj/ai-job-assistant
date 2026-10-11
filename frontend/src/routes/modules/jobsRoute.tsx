import type { FC } from 'react';

import { JobsPage } from '../../pages/jobs/JobsPage';
import { useStatusHistory } from '../../features/dashboard/useStatusHistory';
import { useJobsList } from '../../features/jobs';

/**
 * Renders the jobs route with saved jobs and their status history loaded
 * from the backend. The history is a separate request, so it only dates
 * applications and never holds up or replaces the list.
 *
 * @returns {JSX.Element} Jobs route content.
 */
export const Component: FC = () => {
  const { error, isLoading, jobs, reload } = useJobsList();
  const statusHistory = useStatusHistory();

  return (
    <JobsPage
      error={error}
      isLoading={isLoading}
      jobs={jobs}
      onRetry={reload}
      statusHistory={statusHistory}
    />
  );
};
