import { describe, expect, it } from 'vitest';

import { createMockJob } from '../../test/mockJobs';
import { formatDashboardDate, getDashboardData, getStatusMeterWidth } from './dashboard.utils';

describe('getDashboardData', () => {
  it('counts statuses, active jobs, and recent jobs', () => {
    const data = getDashboardData([
      createMockJob({
        id: 'old',
        status: 'APPLIED',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      createMockJob({
        id: 'new',
        status: 'REJECTED',
        updatedAt: '2026-01-03T00:00:00.000Z',
      }),
      createMockJob({
        id: 'middle',
        status: 'OFFER',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    ]);

    expect(data.totalJobCount).toBe(3);
    expect(data.activeJobCount).toBe(2);
    expect(data.statusCounts).toMatchObject({
      APPLIED: 1,
      OFFER: 1,
      REJECTED: 1,
    });
    expect(data.recentJobs.map((job) => job.id)).toEqual(['new', 'middle', 'old']);
  });
});

describe('formatDashboardDate', () => {
  it('formats dashboard dates for English and German', () => {
    expect(formatDashboardDate('2026-05-09T15:20:00.000Z', 'en')).toBe('May 9');
    expect(formatDashboardDate('2026-05-09T15:20:00.000Z', 'de')).toBe('9. Mai');
  });
});

describe('getStatusMeterWidth', () => {
  it('returns proportional meter widths and handles empty totals', () => {
    expect(getStatusMeterWidth(2, 4)).toBe('50%');
    expect(getStatusMeterWidth(2, 0)).toBe('0%');
  });
});
