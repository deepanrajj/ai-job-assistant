import { createLocalId } from './jobs.utils';
import type { TJob } from '../../types';
import type { TJobFormValues } from './jobFormSchema';

/**
 * Creates empty or edit-ready default values for the job form.
 *
 * @param {TJob | undefined} job Existing job when editing.
 * @returns {TJobFormValues} Job form default values.
 */
export const createJobFormDefaultValues = (job?: TJob): TJobFormValues => ({
  company: job?.company ?? '',
  description: job?.description ?? '',
  jobUrl: job?.jobUrl ?? '',
  location: job?.location ?? '',
  roleTitle: job?.roleTitle ?? '',
  salaryMax: job?.salaryMax !== undefined ? String(job.salaryMax) : '',
  salaryMin: job?.salaryMin !== undefined ? String(job.salaryMin) : '',
  status: job?.status ?? 'WISHLIST',
});

/**
 * Converts optional form text to undefined when it is blank.
 *
 * @param {string} value Form text value.
 * @returns {string | undefined} Trimmed text or undefined.
 */
const getOptionalText = (value: string): string | undefined => {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
};

/**
 * Converts optional salary text to a number.
 *
 * @param {string} value Salary form value.
 * @returns {number | undefined} Salary number or undefined.
 */
const getOptionalSalary = (value: string): number | undefined => {
  const trimmedValue = value.trim();

  return trimmedValue ? Number(trimmedValue) : undefined;
};

/**
 * Creates a frontend job payload from submitted form values.
 *
 * @param {TJobFormValues} values Submitted form values.
 * @param {TJob | undefined} job Existing job when editing.
 * @param {string} updatedAt ISO timestamp used for the payload update date.
 * @returns {TJob} Normalized job payload.
 */
export const createJobFormPayload = (
  values: TJobFormValues,
  job?: TJob,
  updatedAt = new Date().toISOString(),
): TJob => ({
  company: values.company,
  createdAt: job?.createdAt ?? updatedAt,
  description: getOptionalText(values.description),
  id: job?.id ?? createLocalId('job'),
  jobUrl: getOptionalText(values.jobUrl),
  location: getOptionalText(values.location),
  roleTitle: values.roleTitle,
  salaryMax: getOptionalSalary(values.salaryMax),
  salaryMin: getOptionalSalary(values.salaryMin),
  status: values.status,
  updatedAt,
});
