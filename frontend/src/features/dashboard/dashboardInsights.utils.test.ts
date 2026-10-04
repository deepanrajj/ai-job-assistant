import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  AGING_APPLICATIONS_LIMIT,
  getDashboardInsights,
  getLocalCalendarDayDifference,
  getLocalWeek,
} from './dashboardInsights.utils';
import { createMockJob } from '../../test/mockJobs';
import { createMockTimelineEventResponse } from '../../test/mockTimeline';
import type { TJob, TJobStatus } from '../../types';
import type { TTimelineEventResponse } from '../../services';

/**
 * Week and age rules are defined in the browser's local time, so the file
 * runs in a zone with daylight saving. Node applies a change to the `TZ`
 * environment variable immediately, so stubbing it here takes effect
 * without restarting the worker. In 2026 Europe/Berlin moves to
 * summer time on Sunday 29 March and back on Sunday 25 October.
 */
const TEST_TIMEZONE = 'Europe/Berlin';

beforeAll(() => {
  vi.stubEnv('TZ', TEST_TIMEZONE);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

/**
 * A local Berlin moment. Built inside each test, after the zone is pinned.
 */
const local = (month: number, day: number, hour = 12, minute = 0): Date =>
  new Date(2026, month - 1, day, hour, minute);

let eventCounter = 0;

const statusEvent = (
  jobId: string,
  nextStatus: TJobStatus,
  at: Date,
  previousStatus: TJobStatus | null = null,
): TTimelineEventResponse => {
  eventCounter += 1;

  return createMockTimelineEventResponse({
    createdAt: at.toISOString(),
    id: `event-${String(eventCounter).padStart(4, '0')}`,
    jobId,
    nextStatus,
    previousStatus,
  });
};

const job = (id: string, status: TJobStatus, overrides: Partial<TJob> = {}): TJob =>
  createMockJob({ company: `Company ${id}`, id, status, ...overrides });

describe('getLocalWeek', () => {
  it('runs from Monday midnight to the next Monday midnight', () => {
    const { end, start } = getLocalWeek(local(10, 7));

    expect(start).toEqual(local(10, 5, 0));
    expect(end).toEqual(local(10, 12, 0));
  });

  it('starts the week on the Monday itself at midnight', () => {
    expect(getLocalWeek(local(10, 5, 0)).start).toEqual(local(10, 5, 0));
  });

  it('keeps a Sunday just before midnight in the week that began six days earlier', () => {
    expect(getLocalWeek(local(10, 11, 23, 59)).start).toEqual(local(10, 5, 0));
  });

  it('ends at local midnight across the October change back to standard time', () => {
    const { end, start } = getLocalWeek(local(10, 25, 23, 30));

    expect(start).toEqual(local(10, 19, 0));
    expect(end).toEqual(local(10, 26, 0));
    expect(end.getTime() - start.getTime()).toBe((7 * 24 + 1) * 60 * 60 * 1000);
  });
});

describe('getLocalCalendarDayDifference', () => {
  it('counts calendar days, not 24-hour periods, across the October change', () => {
    // 26 hours elapse here, which a millisecond division would call one day.
    expect(getLocalCalendarDayDifference(local(10, 24, 23, 30), local(10, 26, 0, 30))).toBe(2);
  });

  it('counts calendar days across the March change', () => {
    // 46 hours 20 minutes elapse, which rounding would call two days.
    expect(getLocalCalendarDayDifference(local(3, 28, 0, 30), local(3, 29, 23, 50))).toBe(1);
  });

  it('is zero on the same day', () => {
    expect(getLocalCalendarDayDifference(local(10, 7, 0, 1), local(10, 7, 23, 59))).toBe(0);
  });
});

describe('getDashboardInsights', () => {
  it('handles no jobs and no history', () => {
    expect(getDashboardInsights([], [], local(10, 7))).toEqual({
      agingApplications: { items: [], total: 0, unknownDateCount: 0 },
      applicationsThisWeek: {
        count: 0,
        unknownDateCount: 0,
        weekEnd: local(10, 12, 0),
        weekStart: local(10, 5, 0),
      },
      interviewRate: { cohortSize: 0, interviewed: 0, rate: null },
    });
  });

  it('counts applications recorded this week, and jobs without a recorded application apart', () => {
    const jobs = [
      job('monday', 'APPLIED'),
      job('sunday-night', 'INTERVIEW'),
      job('last-week', 'APPLIED'),
      job('next-monday', 'APPLIED'),
      job('saved-as-applied', 'APPLIED'),
      job('skipped-applied', 'INTERVIEW'),
      job('wishlist', 'WISHLIST'),
    ];
    const events = [
      statusEvent('monday', 'APPLIED', local(10, 5, 0)),
      statusEvent('sunday-night', 'APPLIED', local(10, 11, 23, 59)),
      statusEvent('sunday-night', 'INTERVIEW', local(10, 11, 23, 59)),
      statusEvent('last-week', 'APPLIED', local(10, 4, 23, 59)),
      statusEvent('next-monday', 'APPLIED', local(10, 12, 0)),
      statusEvent('skipped-applied', 'INTERVIEW', local(10, 6)),
    ];

    const { applicationsThisWeek } = getDashboardInsights(jobs, events, local(10, 7));

    expect(applicationsThisWeek.count).toBe(2);
    // saved-as-applied and skipped-applied: past WISHLIST, no APPLIED event.
    expect(applicationsThisWeek.unknownDateCount).toBe(2);
  });

  it('counts a repeated APPLIED transition once, from its first date', () => {
    const jobs = [job('reapplied', 'APPLIED')];
    const events = [
      statusEvent('reapplied', 'APPLIED', local(9, 1)),
      statusEvent('reapplied', 'INTERVIEW', local(9, 10), 'APPLIED'),
      statusEvent('reapplied', 'APPLIED', local(10, 6), 'INTERVIEW'),
    ];

    const insights = getDashboardInsights(jobs, events, local(10, 7));

    expect(insights.applicationsThisWeek.count).toBe(0);
    expect(insights.interviewRate).toEqual({ cohortSize: 1, interviewed: 1, rate: 1 });
    expect(insights.agingApplications.items[0]?.ageDays).toBe(36);
  });

  it('finds the first application however the history is ordered', () => {
    const jobs = [job('unordered', 'APPLIED')];
    const events = [
      statusEvent('unordered', 'APPLIED', local(10, 6)),
      statusEvent('unordered', 'APPLIED', local(10, 1)),
    ];

    expect(
      getDashboardInsights(jobs, events, local(10, 7)).agingApplications.items[0]?.ageDays,
    ).toBe(6);
  });

  it('does not reset an application age when the job is edited later', () => {
    const jobs = [
      job('edited', 'APPLIED', {
        description: 'Rewritten yesterday',
        updatedAt: local(10, 6).toISOString(),
      }),
    ];
    const events = [statusEvent('edited', 'APPLIED', local(9, 27))];

    expect(getDashboardInsights(jobs, events, local(10, 7)).agingApplications.items).toEqual([
      { ageDays: 10, job: jobs[0] },
    ]);
  });

  it('counts recorded interviews for jobs now in OFFER or REJECTED, but not a direct jump to OFFER', () => {
    const jobs = [
      job('offer', 'OFFER'),
      job('rejected', 'REJECTED'),
      job('straight-to-offer', 'OFFER'),
      job('waiting', 'APPLIED'),
    ];
    const events = [
      statusEvent('offer', 'APPLIED', local(9, 1)),
      statusEvent('offer', 'INTERVIEW', local(9, 5), 'APPLIED'),
      statusEvent('offer', 'OFFER', local(9, 9), 'INTERVIEW'),
      statusEvent('rejected', 'APPLIED', local(9, 2)),
      statusEvent('rejected', 'INTERVIEW', local(9, 6), 'APPLIED'),
      statusEvent('rejected', 'REJECTED', local(9, 8), 'INTERVIEW'),
      statusEvent('straight-to-offer', 'APPLIED', local(9, 3)),
      statusEvent('straight-to-offer', 'OFFER', local(9, 7), 'APPLIED'),
      statusEvent('waiting', 'APPLIED', local(9, 4)),
    ];

    expect(getDashboardInsights(jobs, events, local(10, 7)).interviewRate).toEqual({
      cohortSize: 4,
      interviewed: 2,
      rate: 0.5,
    });
  });

  it('does not count an interview recorded before the application', () => {
    const jobs = [job('odd-order', 'APPLIED')];
    const events = [
      statusEvent('odd-order', 'INTERVIEW', local(9, 1)),
      statusEvent('odd-order', 'APPLIED', local(9, 2), 'INTERVIEW'),
    ];

    expect(getDashboardInsights(jobs, events, local(10, 7)).interviewRate.interviewed).toBe(0);
  });

  it('gives no interview rate, rather than 0%, when no application is recorded', () => {
    const jobs = [job('saved-as-applied', 'APPLIED')];

    expect(getDashboardInsights(jobs, [], local(10, 7)).interviewRate).toEqual({
      cohortSize: 0,
      interviewed: 0,
      rate: null,
    });
  });

  it('ignores history for jobs that no longer exist', () => {
    const events = [statusEvent('deleted', 'APPLIED', local(10, 6))];

    expect(getDashboardInsights([], events, local(10, 7)).applicationsThisWeek.count).toBe(0);
  });

  it('lists only jobs still in APPLIED, oldest first, up to the limit, with the full total', () => {
    const appliedIds = ['a', 'b', 'c', 'd', 'e', 'f'];
    const jobs = [
      ...appliedIds.map((id) => job(id, 'APPLIED')),
      job('moved-on', 'INTERVIEW'),
      job('no-date', 'APPLIED'),
    ];
    const events = [
      ...appliedIds.map((id, index) => statusEvent(id, 'APPLIED', local(9, 20 - index))),
      statusEvent('moved-on', 'APPLIED', local(8, 1)),
      statusEvent('moved-on', 'INTERVIEW', local(8, 3), 'APPLIED'),
    ];

    const { agingApplications } = getDashboardInsights(jobs, events, local(10, 7));

    expect(agingApplications.items.map((item) => [item.job.id, item.ageDays])).toEqual([
      ['f', 22],
      ['e', 21],
      ['d', 20],
      ['c', 19],
      ['b', 18],
    ]);
    expect(agingApplications.items).toHaveLength(AGING_APPLICATIONS_LIMIT);
    expect(agingApplications.total).toBe(6);
    expect(agingApplications.unknownDateCount).toBe(1);
  });

  it('ages an application across the October change in calendar days', () => {
    const jobs = [job('dst', 'APPLIED')];
    const events = [statusEvent('dst', 'APPLIED', local(10, 24, 23, 30))];

    expect(
      getDashboardInsights(jobs, events, local(10, 26, 0, 30)).agingApplications.items[0]?.ageDays,
    ).toBe(2);
  });

  it('counts an application late on the Sunday the clocks go back in that week', () => {
    const jobs = [job('late-sunday', 'APPLIED')];
    const events = [statusEvent('late-sunday', 'APPLIED', local(10, 25, 23, 45))];

    expect(
      getDashboardInsights(jobs, events, local(10, 25, 23, 50)).applicationsThisWeek.count,
    ).toBe(1);
  });
});
