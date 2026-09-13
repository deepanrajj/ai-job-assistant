import { useMemo } from 'react';

import { useJob } from './useJob';
import { mapJobToJobDetail } from './jobs.utils';
import type { AppError } from '../../errors';
import type { TJobDetail } from '../../types';

/**
 * Job detail state returned by useJobDetail.
 */
export interface IJobDetailState {
  error: AppError | null;
  isLoading: boolean;
  isNotFound: boolean;
  job: TJobDetail | null;
  reload: () => void;
}

/**
 * Loads one saved job and widens it into the job detail shape.
 *
 * Everything about the request belongs to `useJob`; this adds the widening
 * the detail screen needs and nothing else. The two are separate because a
 * form wants the narrower shape: widening turns an absent salary into a
 * real zero, which a rendering screen shows as no salary and a form would
 * prefill and then save back as one.
 *
 * @param {string} jobId Job identifier from the route.
 * @returns {IJobDetailState} Widened job, request state, and retry.
 */
export const useJobDetail = (jobId: string): IJobDetailState => {
  const { error, isLoading, isNotFound, job, reload } = useJob(jobId);
  const jobDetail = useMemo(() => (job ? mapJobToJobDetail(job) : null), [job]);

  return {
    error,
    isLoading,
    isNotFound,
    job: jobDetail,
    reload,
  };
};
