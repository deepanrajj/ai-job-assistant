import type { FC } from 'react';

import { JobsPage } from '../../pages/jobs/JobsPage';
import { useJobs } from '../../features/jobs';

/**
 * Renders the jobs route with saved local job data.
 *
 * @returns {JSX.Element} Jobs route content.
 */
export const Component: FC = () => {
  const { jobs } = useJobs();

  return <JobsPage jobs={jobs} />;
};
