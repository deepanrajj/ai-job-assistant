import type { FC } from 'react';

import { DashboardPage } from '../../pages/dashboard/DashboardPage';
import { mockJobs } from '../../data/mockJobs';

/**
 * Renders the dashboard route with mock job data.
 *
 * @returns {JSX.Element} Dashboard route content.
 */
export const Component: FC = () => <DashboardPage jobs={mockJobs} />;
