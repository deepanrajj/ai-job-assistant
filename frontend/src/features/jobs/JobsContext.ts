import { createContext } from 'react';

import type { IJobsContextValue } from './jobsStore.types';

/**
 * React context that stores the local job tracker state and mutation actions.
 */
export const JobsContext = createContext<IJobsContextValue | null>(null);
