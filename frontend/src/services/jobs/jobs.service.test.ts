import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createJob, deleteJob, getJobById, getJobs, updateJob } from './jobs.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TJobResponse } from './jobs.types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';

/**
 * A job exactly as the backend sends it, nulls included.
 */
const jobResponse: TJobResponse = {
  id: JOB_ID,
  company: 'Acme Corp',
  roleTitle: 'Backend Engineer',
  location: null,
  status: 'WISHLIST',
  jobUrl: null,
  salaryMin: null,
  salaryMax: null,
  description: null,
  createdAt: '2026-09-10T18:50:40.881640926Z',
  updatedAt: '2026-09-10T18:50:40.881640926Z',
};

describe('jobs.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue(jobResponse);
    vi.mocked(postJson).mockResolvedValue(jobResponse);
    vi.mocked(putJson).mockResolvedValue(jobResponse);
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it('requests the jobs collection with the list error mapping', async () => {
    vi.mocked(getJson).mockResolvedValue([jobResponse]);

    const jobs = await getJobs();

    expect(getJson).toHaveBeenCalledWith('/api/jobs', {
      errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load jobs',
    });
    expect(jobs).toEqual([jobResponse]);
  });

  it('puts the id in the path when requesting one job', async () => {
    const job = await getJobById(JOB_ID);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}`, {
      errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load job',
    });
    expect(job).toEqual(jobResponse);
  });

  it('posts only the fields the backend accepts when creating a job', async () => {
    const job = await createJob({
      company: 'Acme Corp',
      roleTitle: 'Backend Engineer',
    });

    expect(postJson).toHaveBeenCalledWith(
      '/api/jobs',
      {
        company: 'Acme Corp',
        roleTitle: 'Backend Engineer',
      },
      {
        errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to create job',
      },
    );
    expect(job).toEqual(jobResponse);
  });

  it('sends nulls rather than omissions when an update clears fields', async () => {
    const job = await updateJob(JOB_ID, {
      company: 'New Corp',
      roleTitle: 'Staff Engineer',
      location: null,
      status: 'INTERVIEW',
      jobUrl: null,
      salaryMin: null,
      salaryMax: null,
      description: 'Updated description',
    });

    expect(putJson).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}`,
      {
        company: 'New Corp',
        roleTitle: 'Staff Engineer',
        location: null,
        status: 'INTERVIEW',
        jobUrl: null,
        salaryMin: null,
        salaryMax: null,
        description: 'Updated description',
      },
      {
        errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to update job',
      },
    );
    expect(job).toEqual(jobResponse);
  });

  it('resolves to undefined when deleting, matching the 204 contract', async () => {
    const result = await deleteJob(JOB_ID);

    expect(deleteJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}`, {
      errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete job',
    });
    expect(result).toBeUndefined();
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.JOB_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getJobById(JOB_ID)).rejects.toBe(apiError);
  });
});
