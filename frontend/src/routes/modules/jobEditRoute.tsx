import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { EditJobPage } from '../../pages/jobs/EditJobPage';
import { useJobs } from '../../features/jobs';

/**
 * Renders the edit job route with saved local job data.
 *
 * @returns {JSX.Element} Edit job route content.
 */
export const Component: FC = () => {
  const { jobId = '' } = useParams();
  const { jobs, updateJob } = useJobs();

  return <EditJobPage jobId={jobId} jobs={jobs} onSave={updateJob} />;
};
