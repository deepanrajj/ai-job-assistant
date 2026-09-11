import type { FC } from 'react';

import { JobsPage } from '../../pages/jobs/JobsPage';
import { useJobsList } from '../../features/jobs';

/**
 * Renders the jobs route with saved jobs loaded from the backend.
 *
 * @returns {JSX.Element} Jobs route content.
 */
export const Component: FC = () => {
  const { error, isLoading, jobs, reload } = useJobsList();

  return <JobsPage error={error} isLoading={isLoading} jobs={jobs} onRetry={reload} />;
};
