import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  getCalendarMonth,
  getMonthDateRange,
  getMonthGrid,
  groupCalendarItemsByDate,
  shiftCalendarMonth,
} from './calendar.utils';
import type { TCalendarItem } from './calendar.types';

/**
 * The grid is built from local dates, so the file runs in a zone with
 * daylight saving: Europe/Berlin changes clocks on 29 March and 25
 * October 2026.
 */
beforeAll(() => {
  vi.stubEnv('TZ', 'Europe/Berlin');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const item = (date: string, id: string): TCalendarItem => ({
  date,
  documentType: null,
  id,
  isComplete: false,
  jobId: 'job-1',
  reminderType: 'FOLLOW_UP',
  source: 'REMINDER',
  title: id,
});

describe('getCalendarMonth and shiftCalendarMonth', () => {
  it('reads the month of a local date', () => {
    expect(getCalendarMonth(new Date(2026, 9, 5))).toEqual({ month: 9, year: 2026 });
  });

  it('moves across year boundaries in both directions', () => {
    expect(shiftCalendarMonth({ month: 11, year: 2026 }, 1)).toEqual({ month: 0, year: 2027 });
    expect(shiftCalendarMonth({ month: 0, year: 2026 }, -1)).toEqual({ month: 11, year: 2025 });
    expect(shiftCalendarMonth({ month: 5, year: 2026 }, -18)).toEqual({ month: 11, year: 2024 });
  });
});

describe('getMonthDateRange', () => {
  it('gives the first and last date of the month', () => {
    expect(getMonthDateRange({ month: 9, year: 2026 })).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
    });
  });

  it('handles a leap February', () => {
    expect(getMonthDateRange({ month: 1, year: 2028 })).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
  });
});

describe('getMonthGrid', () => {
  const datesOf = (weeks: ReturnType<typeof getMonthGrid>) =>
    weeks.map((week) => week.map((day) => day.date));

  it('starts weeks on Monday and pads with the neighbouring months', () => {
    // October 2026 starts on a Thursday.
    const weeks = getMonthGrid({ month: 9, year: 2026 });

    expect(weeks).toHaveLength(5);
    expect(datesOf(weeks)[0]).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(weeks[0]?.[2]).toMatchObject({ dayOfMonth: 30, isInMonth: false });
    expect(weeks[0]?.[3]).toMatchObject({ dayOfMonth: 1, isInMonth: true });
    expect(datesOf(weeks)[4]?.at(-1)).toBe('2026-11-01');
  });

  it('needs no leading days when the month starts on Monday', () => {
    // June 2026 starts on a Monday.
    expect(getMonthGrid({ month: 5, year: 2026 })[0]?.[0]).toEqual({
      date: '2026-06-01',
      dayOfMonth: 1,
      isInMonth: true,
    });
  });

  it('uses six weeks when the month needs them', () => {
    // August 2026 starts on a Saturday and has 31 days.
    expect(getMonthGrid({ month: 7, year: 2026 })).toHaveLength(6);
  });

  it('lists every day of the March DST month once and in order', () => {
    const dates = datesOf(getMonthGrid({ month: 2, year: 2026 })).flat();
    const inMonth = dates.filter((date) => date.startsWith('2026-03'));

    expect(inMonth).toHaveLength(31);
    expect(new Set(dates).size).toBe(dates.length);
    expect(inMonth).toContain('2026-03-29');
    expect(inMonth).toContain('2026-03-30');
  });

  it('lists every day of the October DST month once and in order', () => {
    const inMonth = datesOf(getMonthGrid({ month: 9, year: 2026 }))
      .flat()
      .filter((date) => date.startsWith('2026-10'));

    expect(inMonth).toEqual(
      Array.from({ length: 31 }, (_, index) => `2026-10-${String(index + 1).padStart(2, '0')}`),
    );
  });
});

describe('groupCalendarItemsByDate', () => {
  it('groups by date in date order, keeping each date’s items in arrival order', () => {
    const groups = groupCalendarItemsByDate([
      item('2026-10-12', 'b'),
      item('2026-10-03', 'a'),
      item('2026-10-12', 'c'),
    ]);

    expect(groups.map((group) => [group.date, group.items.map((entry) => entry.id)])).toEqual([
      ['2026-10-03', ['a']],
      ['2026-10-12', ['b', 'c']],
    ]);
  });

  it('returns no groups for no items', () => {
    expect(groupCalendarItemsByDate([])).toEqual([]);
  });
});
