import { translate } from '../../i18n';
import type { TJob } from '../../types';
import {
  JOB_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TCreateJobRequest,
  type TJobFallbackErrorKey,
  type TJobFormPayload,
  type TJobResponse,
  type TUpdateJobRequest,
} from './jobs.types';

/**
 * Resolves the localized fallback error message for a job service operation.
 *
 * @param {TJobFallbackErrorKey} key Job operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getJobFallbackErrorMessage = (key: TJobFallbackErrorKey): string =>
  translate(JOB_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Converts a wire null into the undefined the UI model uses.
 *
 * @param {TValue | null} value Wire value that may be null.
 * @returns {TValue | undefined} Undefined when the value was null.
 */
const toOptional = <TValue>(value: TValue | null): TValue | undefined => value ?? undefined;

/**
 * Converts an omitted UI value into the explicit null the backend expects.
 *
 * @param {TValue | undefined} value UI value that may be undefined.
 * @returns {TValue | null} Null when the value was undefined.
 */
const toNullable = <TValue>(value: TValue | undefined): TValue | null => value ?? null;

/**
 * Converts a job API response into the job model the UI renders.
 *
 * @param {TJobResponse} response Job exactly as `/api/jobs` returned it.
 * @returns {TJob} Job in the shape every screen consumes.
 */
export const mapJobResponseToJob = (response: TJobResponse): TJob => ({
  company: response.company,
  createdAt: response.createdAt,
  description: toOptional(response.description),
  id: response.id,
  jobUrl: toOptional(response.jobUrl),
  location: toOptional(response.location),
  roleTitle: response.roleTitle,
  salaryMax: toOptional(response.salaryMax),
  salaryMin: toOptional(response.salaryMin),
  status: response.status,
  updatedAt: response.updatedAt,
});

/**
 * Builds the full editable field set both job write endpoints accept.
 *
 * Every field is sent explicitly, including the ones the create endpoint
 * would default, so clearing a value sends `null` rather than omitting the
 * key. The backend gives no field a default on update, so an omitted key
 * there is not the same as an explicit null.
 *
 * @param {TJobFormPayload} job Editable job fields.
 * @returns {TUpdateJobRequest} Request fields with explicit nulls.
 */
const createJobRequestFields = (job: TJobFormPayload): TUpdateJobRequest => ({
  company: job.company,
  description: toNullable(job.description),
  jobUrl: toNullable(job.jobUrl),
  location: toNullable(job.location),
  roleTitle: job.roleTitle,
  salaryMax: toNullable(job.salaryMax),
  salaryMin: toNullable(job.salaryMin),
  status: job.status,
});

/**
 * Converts editable job fields into a `POST /api/jobs` request body.
 *
 * @param {TJobFormPayload} job Editable job fields.
 * @returns {TCreateJobRequest} Create request body.
 */
export const mapJobToCreateRequest = (job: TJobFormPayload): TCreateJobRequest =>
  createJobRequestFields(job);

/**
 * Converts editable job fields into a `PUT /api/jobs/{id}` request body.
 *
 * @param {TJobFormPayload} job Editable job fields.
 * @returns {TUpdateJobRequest} Update request body.
 */
export const mapJobToUpdateRequest = (job: TJobFormPayload): TUpdateJobRequest =>
  createJobRequestFields(job);
