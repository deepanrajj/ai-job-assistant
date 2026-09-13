import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { EditJobPage } from '../../pages/jobs/EditJobPage';
import { useJob } from '../../features/jobs';

/**
 * Renders the edit job route with the job loaded from the backend.
 *
 * `useJob` rather than `useJobDetail`: the form round-trips the values it
 * prefills, and the detail widening turns an absent salary into a real zero.
 *
 * @returns {JSX.Element} Edit job route content.
 */
export const Component: FC = () => {
  const { jobId = '' } = useParams();
  const { error, isLoading, isNotFound, job, reload } = useJob(jobId);

  return (
    <EditJobPage
      error={error}
      isLoading={isLoading}
      isNotFound={isNotFound}
      job={job}
      onRetry={reload}
    />
  );
};
