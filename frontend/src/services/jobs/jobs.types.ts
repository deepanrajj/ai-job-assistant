import type { TJob, TJobStatus } from '../../types';

/**
 * Translation keys used for job service fallback errors.
 */
export const JOB_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listJobs: 'jobs.fallbackError.listJobs',
  getJob: 'jobs.fallbackError.getJob',
  createJob: 'jobs.fallbackError.createJob',
  updateJob: 'jobs.fallbackError.updateJob',
  deleteJob: 'jobs.fallbackError.deleteJob',
} as const;

/**
 * Supported job fallback error lookup keys.
 */
export type TJobFallbackErrorKey = keyof typeof JOB_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Editable job fields a caller may send to the backend.
 *
 * Excludes `id`, `createdAt` and `updatedAt` because the server owns all
 * three. A request type that accepted an `id` would invite one to be sent,
 * and the backend ignores unknown fields rather than rejecting them.
 */
export type TJobFormPayload = Omit<TJob, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Wire representation of a job exactly as `/api/jobs` returns it.
 *
 * This is not `TJob`. The backend sends `null` rather than omitting empty
 * fields, so the two models differ in a way `mapJobResponseToJob` resolves.
 * This type only promises what the API actually sends.
 */
export type TJobResponse = {
  id: string;
  company: string;
  roleTitle: string;
  location: string | null;
  status: TJobStatus;
  jobUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/jobs`.
 *
 * `status` is optional because the backend defaults it. Every other
 * optional field may be omitted or sent as null.
 */
export type TCreateJobRequest = {
  company: string;
  roleTitle: string;
  location?: string | null;
  status?: TJobStatus;
  jobUrl?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
};

/**
 * Request body accepted by `PUT /api/jobs/{id}`.
 *
 * Deliberately not `Partial<TCreateJobRequest>`. An update replaces every
 * editable field, and the backend requires `status`, so each field is
 * required here and nullable fields must be sent explicitly as null to be
 * cleared.
 */
export type TUpdateJobRequest = {
  company: string;
  roleTitle: string;
  location: string | null;
  status: TJobStatus;
  jobUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string | null;
};
