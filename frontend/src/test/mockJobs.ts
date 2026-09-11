import { mapJobResponseToJob, type TJobResponse } from '../services';
import type { TJob } from '../types';

/**
 * Creates a complete mock job while allowing each test to override relevant fields.
 *
 * @param {Partial<TJob>} overrides Job fields that should differ from the default.
 * @returns {TJob} Mock job suitable for page and table tests.
 */
export const createMockJob = (overrides: Partial<TJob> = {}): TJob => ({
  company: 'Acme GmbH',
  createdAt: '2026-01-01T09:00:00.000Z',
  id: 'job-001',
  jobUrl: 'https://example.com/jobs/frontend',
  location: 'Berlin',
  roleTitle: 'Frontend Engineer',
  salaryMax: 90000,
  salaryMin: 70000,
  status: 'APPLIED',
  updatedAt: '2026-01-02T09:00:00.000Z',
  ...overrides,
});

/**
 * Creates a mock wire job, shaped exactly as `GET /api/jobs` returns one.
 *
 * Nulls rather than omissions, matching the backend, so a test that goes
 * through `mapJobResponseToJob` exercises the conversion instead of
 * skipping past it. Ids are UUIDs and timestamps carry a zone offset with
 * sub-millisecond precision, both as the backend really serialises them, so
 * a fixture id can never coincide with one of the localStorage seed ids.
 *
 * @param {Partial<TJobResponse>} overrides Wire fields that should differ from the default.
 * @returns {TJobResponse} Mock job response suitable for API-backed tests.
 */
export const createMockJobResponse = (overrides: Partial<TJobResponse> = {}): TJobResponse => ({
  company: 'Acme GmbH',
  createdAt: '2026-01-01T09:00:00.123456Z',
  description: null,
  id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  jobUrl: 'https://example.com/jobs/frontend',
  location: 'Berlin',
  roleTitle: 'Frontend Engineer',
  salaryMax: 90000,
  salaryMin: 70000,
  status: 'APPLIED',
  updatedAt: '2026-01-02T09:00:00.123456Z',
  ...overrides,
});

/**
 * Ids of the jobs in the shared mock list, in order.
 *
 * Exported so a test can address one without hardcoding a UUID.
 */
export const MOCK_JOB_IDS = {
  celonis: '11111111-1111-4111-8111-111111111111',
  personio: '22222222-2222-4222-8222-222222222222',
  miro: '33333333-3333-4333-8333-333333333333',
} as const;

/**
 * Creates the job list served by the MSW `GET /api/jobs` handler.
 *
 * @returns {TJobResponse[]} Mock job responses covering multiple statuses.
 */
export const createMockJobResponses = (): TJobResponse[] => [
  createMockJobResponse({
    company: 'Celonis',
    id: MOCK_JOB_IDS.celonis,
    roleTitle: 'Senior Frontend Engineer',
    status: 'INTERVIEW',
    updatedAt: '2026-05-09T15:20:00.123456Z',
  }),
  createMockJobResponse({
    company: 'Personio',
    id: MOCK_JOB_IDS.personio,
    roleTitle: 'Frontend Platform Engineer',
    status: 'APPLIED',
    updatedAt: '2026-05-06T08:45:00.123456Z',
  }),
  createMockJobResponse({
    company: 'Miro',
    id: MOCK_JOB_IDS.miro,
    roleTitle: 'Senior Product Engineer',
    status: 'OFFER',
    updatedAt: '2026-05-07T12:00:00.123456Z',
  }),
];

/**
 * Creates a small representative job list for UI tests.
 *
 * Derived from the wire fixtures through the production mapper so the two
 * cannot drift: renaming a company in one place changes both.
 *
 * @returns {TJob[]} Mock jobs covering multiple statuses and update dates.
 */
export const createMockJobs = (): TJob[] => createMockJobResponses().map(mapJobResponseToJob);
