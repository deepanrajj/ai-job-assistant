import type { FC } from 'react';

import { DashboardPage } from '../../pages/dashboard/DashboardPage';
import { useJobs } from '../../features/jobs';

/**
 * Renders the dashboard route with saved local job data.
 *
 * @returns {JSX.Element} Dashboard route content.
 */
export const Component: FC = () => {
  const { jobs } = useJobs();

  return <DashboardPage jobs={jobs} />;
};
