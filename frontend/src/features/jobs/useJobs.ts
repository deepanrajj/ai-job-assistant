import { useContext } from 'react';

import { JobsContext } from './JobsContext';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';

/**
 * Reads the local jobs context.
 *
 * @returns {IJobsContextValue} Jobs state and mutation actions.
 * @throws {AppError} When used outside JobsProvider.
 */
export const useJobs = () => {
  const context = useContext(JobsContext);

  if (!context) {
    throw new AppError('useJobs must be used inside JobsProvider', APP_ERROR_CODES.UNKNOWN);
  }

  return context;
};
