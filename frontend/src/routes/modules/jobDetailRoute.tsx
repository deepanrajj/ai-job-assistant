import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { JobDetailPage } from '../../pages/jobDetail/JobDetailPage';
import { useJobDetail } from '../../features/jobs';

/**
 * Renders the job detail route with the job loaded from the backend.
 *
 * The route owns the request, as `jobsRoute` does, because it already reads
 * the route param and because `JobDetailPage` owns no state of its own. That
 * keeps the page's cases free of MSW.
 *
 * @returns {JSX.Element} Job detail route content.
 */
export const Component: FC = () => {
  const { jobId = '' } = useParams();
  const { error, isLoading, isNotFound, job, reload } = useJobDetail(jobId);

  return (
    <JobDetailPage
      error={error}
      isLoading={isLoading}
      isNotFound={isNotFound}
      job={job}
      onRetry={reload}
    />
  );
};
