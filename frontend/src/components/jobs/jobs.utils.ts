import type { TLanguage } from '../../i18n';
import type { TJob } from '../../types';

/**
 * Formats a job update date for the active app language.
 *
 * @param {string} date ISO date string to format.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized display date.
 */
export const formatJobDate = (date: string, language: TLanguage): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));

/**
 * Formats a job salary range in thousands of euros.
 *
 * @param {TJob} job Job with optional salary bounds.
 * @returns {string | null} Salary label or null when no salary is set.
 */
export const formatJobSalary = (job: TJob): string | null => {
  const salary = job.salaryMin ?? job.salaryMax;

  if (!salary) return null;

  return job.salaryMin && job.salaryMax
    ? `EUR ${job.salaryMin / 1000}k - EUR ${job.salaryMax / 1000}k`
    : `EUR ${salary / 1000}k`;
};
