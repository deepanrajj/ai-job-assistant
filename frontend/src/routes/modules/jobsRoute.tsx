import type { FC } from 'react';

import { JobsPage } from '../../pages/jobs/JobsPage';
import { mockJobs } from '../../data/mockJobs';

/**
 * Renders the jobs route with mock job data.
 *
 * @returns {JSX.Element} Jobs route content.
 */
export const Component: FC = () => <JobsPage jobs={mockJobs} />;
