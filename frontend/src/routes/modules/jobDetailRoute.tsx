import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { mockJobDetails } from '../../data/mockJobDetails';
import { JobDetailPage } from '../../pages/jobDetail/JobDetailPage';

/**
 * Renders the job detail route with mock job detail data.
 *
 * @returns {JSX.Element} Job detail route content.
 */
export const Component: FC = () => {
  const { jobId = '' } = useParams();

  return <JobDetailPage jobId={jobId} jobs={mockJobDetails} />;
};
