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
  nextStep: 'Follow up',
  roleTitle: 'Frontend Engineer',
  salaryMax: 90000,
  salaryMin: 70000,
  status: 'APPLIED',
  tags: ['React', 'TypeScript'],
  updatedAt: '2026-01-02T09:00:00.000Z',
  ...overrides,
});

/**
 * Creates a small representative job list for UI tests.
 *
 * @returns {TJob[]} Mock jobs covering multiple statuses and update dates.
 */
export const createMockJobs = (): TJob[] => [
  createMockJob({
    company: 'Celonis',
    id: 'job-001',
    roleTitle: 'Senior Frontend Engineer',
    status: 'INTERVIEW',
    tags: ['React', 'Analytics'],
    updatedAt: '2026-05-09T15:20:00.000Z',
  }),
  createMockJob({
    company: 'Personio',
    id: 'job-002',
    roleTitle: 'Frontend Platform Engineer',
    status: 'APPLIED',
    tags: ['Platform', 'Testing'],
    updatedAt: '2026-05-06T08:45:00.000Z',
  }),
  createMockJob({
    company: 'Miro',
    id: 'job-003',
    roleTitle: 'Senior Product Engineer',
    status: 'OFFER',
    tags: ['Product', 'UX'],
    updatedAt: '2026-05-07T12:00:00.000Z',
  }),
];
