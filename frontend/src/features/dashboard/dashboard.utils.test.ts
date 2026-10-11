import { describe, expect, it } from 'vitest';

import {
  formatDashboardDate,
  getDashboardData,
  getStatusMeterWidth,
  groupRemindersByWeek,
} from './dashboard.utils';
import { createMockJob } from '../../test/mockJobs';
import type { TReminderItem } from '../../types';

/**
 * Builds an open reminder due on the given day.
 */
const reminderDue = (id: string, dueDate: string): TReminderItem => ({
  dueDate,
  id,
  isComplete: false,
  jobId: 'job-1',
  source: 'REMINDER',
  title: id,
  type: null,
});

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
    const sameYear = new Date(2026, 9, 11);

    expect(formatDashboardDate('2026-05-09T15:20:00.000Z', 'en', sameYear)).toBe('May 9');
    expect(formatDashboardDate('2026-05-09T15:20:00.000Z', 'de', sameYear)).toBe('9. Mai');
  });

  it('adds the year to a date from another year, so it is not read as this year', () => {
    const nextYear = new Date(2027, 0, 5);

    expect(formatDashboardDate(new Date(2026, 4, 9), 'en', nextYear)).toBe('May 9, 2026');
    expect(formatDashboardDate(new Date(2026, 4, 9), 'de', nextYear)).toBe('9. Mai 2026');
  });
});

describe('getStatusMeterWidth', () => {
  it('returns proportional meter widths and handles empty totals', () => {
    expect(getStatusMeterWidth(2, 4)).toBe('50%');
    expect(getStatusMeterWidth(2, 0)).toBe('0%');
  });
});

describe('groupRemindersByWeek', () => {
  // Wednesday 2026-10-14, in the week of Monday 12 to Sunday 18 October.
  const today = '2026-10-14';
  const weekEnd = '2026-10-19';

  it('groups overdue, this week by day, and later, in that order', () => {
    const groups = groupRemindersByWeek(
      [
        reminderDue('overdue', '2026-10-13'),
        reminderDue('today-a', '2026-10-14'),
        reminderDue('today-b', '2026-10-14'),
        reminderDue('sunday', '2026-10-18'),
        reminderDue('next-week', '2026-10-19'),
      ],
      today,
      weekEnd,
    );

    expect(
      groups.map(({ date, kind, reminders }) => [kind, date, reminders.map((r) => r.id)]),
    ).toEqual([
      ['overdue', null, ['overdue']],
      ['day', '2026-10-14', ['today-a', 'today-b']],
      ['day', '2026-10-18', ['sunday']],
      ['later', null, ['next-week']],
    ]);
  });

  it('orders day groups by date whatever order the reminders arrive in', () => {
    const groups = groupRemindersByWeek(
      [reminderDue('friday', '2026-10-16'), reminderDue('thursday', '2026-10-15')],
      today,
      weekEnd,
    );

    expect(groups.map((group) => group.date)).toEqual(['2026-10-15', '2026-10-16']);
  });

  it('leaves out empty groups and days without reminders', () => {
    const groups = groupRemindersByWeek([reminderDue('friday', '2026-10-16')], today, weekEnd);

    expect(groups).toEqual([
      { date: '2026-10-16', kind: 'day', reminders: [reminderDue('friday', '2026-10-16')] },
    ]);
    expect(groupRemindersByWeek([], today, weekEnd)).toEqual([]);
  });
});
