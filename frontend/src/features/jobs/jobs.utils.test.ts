import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLocalId, formatJobDate, formatJobSalary } from './jobs.utils';
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
