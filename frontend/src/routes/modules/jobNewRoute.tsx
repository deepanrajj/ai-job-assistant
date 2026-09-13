import type { FC } from 'react';

import { NewJobPage } from '../../pages/jobs/NewJobPage';

/**
 * Renders the new job route.
 *
 * The page owns the create request, so this stays a plain render. Unlike
 * `jobsRoute`, there is no state to lift: the submit flow already lives
 * with the form that must keep its values when a create fails.
 *
 * @returns {JSX.Element} New job route content.
 */
export const Component: FC = () => <NewJobPage />;
