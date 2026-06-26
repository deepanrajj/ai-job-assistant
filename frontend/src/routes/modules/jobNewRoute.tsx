import type { FC } from 'react';

import { NewJobPage } from '../../pages/jobs/NewJobPage';
import { useJobs } from '../../features/jobs';

/**
 * Renders the new job route.
 *
 * @returns {JSX.Element} New job route content.
 */
export const Component: FC = () => {
  const { createJob } = useJobs();

  return <NewJobPage onSave={createJob} />;
};
