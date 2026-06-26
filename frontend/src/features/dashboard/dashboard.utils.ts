import type { TLanguage } from '../../i18n';
import { inactiveJobStatuses, RECENT_JOBS_LIMIT } from './dashboard.constants';
import type { TJob } from '../../types';
import type { IDashboardData, TJobStatusCounts } from './dashboard.types';

/**
 * Creates an empty count map for every supported job status.
 *
 * @returns {TJobStatusCounts} Empty job status counts.
 */
const createEmptyStatusCounts = (): TJobStatusCounts => ({
  WISHLIST: 0,
  APPLIED: 0,
  INTERVIEW: 0,
  OFFER: 0,
  REJECTED: 0,
  WITHDRAWN: 0,
});

/**
 * Derives the job counts and recent activity displayed by the dashboard.
 *
 * @param {TJob[]} jobs Jobs available to summarize.
 * @returns {IDashboardData} Derived dashboard job data.
 */
export const getDashboardData = (jobs: TJob[]): IDashboardData => {
  const statusCounts = createEmptyStatusCounts();
  let activeJobCount = 0;

  jobs.forEach((job) => {
    statusCounts[job.status] += 1;

    if (!inactiveJobStatuses.includes(job.status)) activeJobCount += 1;
  });

  const recentJobs = [...jobs]
    .sort(
      (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
    )
    .slice(0, RECENT_JOBS_LIMIT);

  return {
    activeJobCount,
    recentJobs,
    statusCounts,
    totalJobCount: jobs.length,
  };
};

/**
 * Formats a dashboard activity date for the active language.
 *
 * @param {string} date ISO date string to format.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized dashboard date.
 */
export const formatDashboardDate = (date: string, language: TLanguage): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));

/**
 * Calculates the visual width for a job status meter.
 *
 * @param {number} count Jobs assigned to the status.
 * @param {number} totalJobCount Total jobs represented by the meter.
 * @returns {string} Percentage width for the status meter.
 */
export const getStatusMeterWidth = (count: number, totalJobCount: number): string =>
  totalJobCount > 0 ? `${(count / totalJobCount) * 100}%` : '0%';
