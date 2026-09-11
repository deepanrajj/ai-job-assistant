import { describe, expect, it } from 'vitest';

import {
  getJobFallbackErrorMessage,
  mapJobResponseToJob,
  mapJobToCreateRequest,
  mapJobToUpdateRequest,
} from './jobs.utils';
import type { TJobFormPayload, TJobResponse } from './jobs.types';

const populatedResponse: TJobResponse = {
  id: 'job-001',
  company: 'Acme GmbH',
  roleTitle: 'Frontend Engineer',
  location: 'Berlin',
  status: 'APPLIED',
  jobUrl: 'https://example.com/jobs/1',
  salaryMin: 70000,
  salaryMax: 90000,
  description: 'Build frontend workflows.',
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-01-02T09:00:00.000Z',
};

const clearedResponse: TJobResponse = {
  ...populatedResponse,
  location: null,
  jobUrl: null,
  salaryMin: null,
  salaryMax: null,
  description: null,
};

const populatedPayload: TJobFormPayload = {
  company: 'Acme GmbH',
  roleTitle: 'Frontend Engineer',
  location: 'Berlin',
  status: 'APPLIED',
  jobUrl: 'https://example.com/jobs/1',
  salaryMin: 70000,
  salaryMax: 90000,
  description: 'Build frontend workflows.',
};

const clearedPayload: TJobFormPayload = {
  company: 'Acme GmbH',
  roleTitle: 'Frontend Engineer',
  status: 'APPLIED',
};

/** Fields the backend accepts on a job write, and nothing else. */
const requestKeys = [
  'company',
  'description',
  'jobUrl',
  'location',
  'roleTitle',
  'salaryMax',
  'salaryMin',
  'status',
];

describe('job service utils', () => {
  it('resolves the localized fallback error message for an operation', () => {
    expect(getJobFallbackErrorMessage('listJobs')).toBe('Failed to load jobs');
  });

  it('maps a fully populated response into the UI job model', () => {
    expect(mapJobResponseToJob(populatedResponse)).toEqual({
      company: 'Acme GmbH',
      createdAt: '2026-01-01T09:00:00.000Z',
      description: 'Build frontend workflows.',
      id: 'job-001',
      jobUrl: 'https://example.com/jobs/1',
      location: 'Berlin',
      roleTitle: 'Frontend Engineer',
      salaryMax: 90000,
      salaryMin: 70000,
      status: 'APPLIED',
      updatedAt: '2026-01-02T09:00:00.000Z',
    });
  });

  it('converts every cleared wire null into undefined', () => {
    const job = mapJobResponseToJob(clearedResponse);

    expect(job.location).toBeUndefined();
    expect(job.jobUrl).toBeUndefined();
    expect(job.salaryMin).toBeUndefined();
    expect(job.salaryMax).toBeUndefined();
    expect(job.description).toBeUndefined();
  });

  it('keeps a zero salary rather than treating it as cleared', () => {
    expect(mapJobResponseToJob({ ...populatedResponse, salaryMin: 0 }).salaryMin).toBe(0);
  });

  /**
   * Asserted on the key set rather than by reading the properties. A type
   * that no longer declares `tags` cannot be read from in a compiling test,
   * so only the key set can show the mapper does not invent one.
   */
  it('produces a job with no tags and no next step key', () => {
    expect(Object.keys(mapJobResponseToJob(populatedResponse)).sort()).toEqual([
      'company',
      'createdAt',
      'description',
      'id',
      'jobUrl',
      'location',
      'roleTitle',
      'salaryMax',
      'salaryMin',
      'status',
      'updatedAt',
    ]);
  });

  it('maps editable fields into a create request', () => {
    expect(mapJobToCreateRequest(populatedPayload)).toEqual({
      company: 'Acme GmbH',
      description: 'Build frontend workflows.',
      jobUrl: 'https://example.com/jobs/1',
      location: 'Berlin',
      roleTitle: 'Frontend Engineer',
      salaryMax: 90000,
      salaryMin: 70000,
      status: 'APPLIED',
    });
  });

  it('maps editable fields into an update request', () => {
    expect(mapJobToUpdateRequest(populatedPayload)).toEqual({
      company: 'Acme GmbH',
      description: 'Build frontend workflows.',
      jobUrl: 'https://example.com/jobs/1',
      location: 'Berlin',
      roleTitle: 'Frontend Engineer',
      salaryMax: 90000,
      salaryMin: 70000,
      status: 'APPLIED',
    });
  });

  it('sends an explicit null for every omitted field on create', () => {
    expect(mapJobToCreateRequest(clearedPayload)).toEqual({
      company: 'Acme GmbH',
      description: null,
      jobUrl: null,
      location: null,
      roleTitle: 'Frontend Engineer',
      salaryMax: null,
      salaryMin: null,
      status: 'APPLIED',
    });
  });

  it('sends an explicit null for every omitted field on update', () => {
    expect(mapJobToUpdateRequest(clearedPayload)).toEqual({
      company: 'Acme GmbH',
      description: null,
      jobUrl: null,
      location: null,
      roleTitle: 'Frontend Engineer',
      salaryMax: null,
      salaryMin: null,
      status: 'APPLIED',
    });
  });

  /**
   * The backend silently ignores unknown request fields and answers 201, so
   * a mapper that sent `tags` would pass every mocked test and lose data
   * against the real service. Only the key set can catch that.
   */
  it('sends exactly the fields the backend accepts, and no others', () => {
    expect(Object.keys(mapJobToCreateRequest(populatedPayload)).sort()).toEqual(requestKeys);
    expect(Object.keys(mapJobToUpdateRequest(populatedPayload)).sort()).toEqual(requestKeys);
  });
});
