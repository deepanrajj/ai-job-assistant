import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLocalId, formatJobDate, formatJobSalary, mapJobToJobDetail } from './jobs.utils';
import { createMockJob } from '../../test/mockJobs';

describe('createLocalId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates prefixed random ids and uses unique timestamp fallback ids', () => {
    expect(createLocalId('job', () => 'random-id')).toBe('job-random-id');

    vi.spyOn(Date, 'now').mockReturnValue(123);
    const firstFallbackId = createLocalId('job', () => undefined);
    const secondFallbackId = createLocalId('job', () => undefined);

    expect(firstFallbackId).toMatch(/^job-123-\d+$/);
    expect(secondFallbackId).toMatch(/^job-123-\d+$/);
    expect(firstFallbackId).not.toBe(secondFallbackId);
  });
});

describe('formatJobDate', () => {
  it('formats job dates for English and German', () => {
    expect(formatJobDate('2026-05-09T15:20:00.000Z', 'en')).toBe('May 9, 2026');
    expect(formatJobDate('2026-05-09T15:20:00.000Z', 'de')).toBe('9. Mai 2026');
  });
});

describe('formatJobSalary', () => {
  it('formats full, partial, and missing salary ranges', () => {
    expect(
      formatJobSalary(
        createMockJob({
          salaryMax: 90000,
          salaryMin: 70000,
        }),
      ),
    ).toBe('EUR 70k - EUR 90k');
    expect(
      formatJobSalary(
        createMockJob({
          salaryMax: undefined,
          salaryMin: 70000,
        }),
      ),
    ).toBe('EUR 70k');
    expect(
      formatJobSalary(
        createMockJob({
          salaryMax: 90000,
          salaryMin: undefined,
        }),
      ),
    ).toBe('EUR 90k');
    expect(
      formatJobSalary(
        createMockJob({
          salaryMax: undefined,
          salaryMin: undefined,
        }),
      ),
    ).toBeNull();
    expect(
      formatJobSalary(
        createMockJob({
          salaryMax: 0,
          salaryMin: 0,
        }),
      ),
    ).toBeNull();
  });
});

describe('mapJobToJobDetail', () => {
  it('fills the optional job fields and leaves every detail collection empty', () => {
    const job = createMockJob({
      description: undefined,
      jobUrl: undefined,
      location: undefined,
      salaryMax: undefined,
      salaryMin: undefined,
    });

    expect(mapJobToJobDetail(job)).toMatchObject({
      aiInsights: {
        gaps: [],
        strengths: [],
        summary: '',
      },
      description: '',
      id: job.id,
      jobUrl: '',
      location: '',
      notes: [],
      salaryMax: 0,
      salaryMin: 0,
      tasks: [],
      // A job from the API has no history, and inventing one would put a
      // fabricated event on a tab whose data source is task 032.
      timeline: [],
    });
  });

  it('keeps the values a job already carries', () => {
    expect(mapJobToJobDetail(createMockJob({ description: 'Platform work' }))).toMatchObject({
      description: 'Platform work',
      jobUrl: 'https://example.com/jobs/frontend',
      location: 'Berlin',
      salaryMax: 90000,
      salaryMin: 70000,
    });
  });
});
