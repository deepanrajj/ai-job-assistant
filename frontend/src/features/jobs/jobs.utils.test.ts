import { describe, expect, it } from 'vitest';

import { formatJobDate, formatJobSalary } from './jobs.utils';
import { createMockJob } from '../../test/mockJobs';

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
  });
});
