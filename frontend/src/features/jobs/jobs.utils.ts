import type { TLanguage } from '../../i18n';
import type { TJob, TJobDetail } from '../../types';

/**
 * Creates a browser-native random id when the runtime supports it.
 *
 * @returns {string | undefined} Random id or undefined when unavailable.
 */
const createRandomId = (): string | undefined => globalThis.crypto?.randomUUID?.();

let fallbackIdCounter = 0;

/**
 * Creates a collision-resistant fallback id when crypto random ids are unavailable.
 *
 * @returns {string} Timestamp and counter based fallback id.
 */
const createFallbackId = (): string => {
  fallbackIdCounter += 1;

  return `${Date.now()}-${fallbackIdCounter}`;
};

/**
 * Creates a local-only id with a stable prefix and a random value when available.
 *
 * @param {string} prefix Prefix that describes the entity type.
 * @param {() => string | undefined} randomId Optional random id factory.
 * @returns {string} Local entity id.
 */
export const createLocalId = (
  prefix: string,
  randomId: () => string | undefined = createRandomId,
): string => `${prefix}-${randomId() ?? createFallbackId()}`;

/**
 * Formats a date in the short month/day/year style every job screen uses.
 *
 * @param {Date} date Date to format.
 * @param {TLanguage} language Active app language.
 * @param {string} [timeZone] Time zone to format in; the user's own when omitted.
 * @returns {string} Localized display date.
 */
const formatLocalizedDate = (date: Date, language: TLanguage, timeZone?: string): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date);

/**
 * Formats a job update date for the active app language.
 *
 * @param {string} date ISO date string to format.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized display date.
 */
export const formatJobDate = (date: string, language: TLanguage): string =>
  formatLocalizedDate(new Date(date), language);

/**
 * Formats a date-only value (`YYYY-MM-DD`, such as a contact's
 * `lastContactedAt`) for the active app language.
 *
 * A date-only string parses as midnight UTC, which every timezone behind
 * UTC renders as the previous day, so unlike `formatJobDate` this formats
 * in UTC to keep the same calendar day wherever the user is. Parsing the
 * string itself, rather than `new Date(year, month - 1, day)`, also keeps
 * years 0-99 as written instead of mapping them to 1900-1999.
 *
 * @param {string} date Date-only string in `YYYY-MM-DD` form.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized display date.
 */
export const formatCalendarDate = (date: string, language: TLanguage): string =>
  formatLocalizedDate(new Date(date), language, 'UTC');

/**
 * Formats a job salary range in thousands of euros.
 *
 * @param {TJob} job Job with optional salary bounds.
 * @returns {string | null} Salary label or null when no salary is set.
 */
export const formatJobSalary = (job: TJob): string | null => {
  const salaryMin = job.salaryMin !== undefined && job.salaryMin > 0 ? job.salaryMin : undefined;
  const salaryMax = job.salaryMax !== undefined && job.salaryMax > 0 ? job.salaryMax : undefined;
  const salary = salaryMin ?? salaryMax;

  if (salary === undefined) return null;

  return salaryMin !== undefined && salaryMax !== undefined
    ? `EUR ${salaryMin / 1000}k - EUR ${salaryMax / 1000}k`
    : `EUR ${salary / 1000}k`;
};

/**
 * Widens a job into the detail shape the job detail screen renders.
 *
 * `TJobDetail` requires the four fields `TJob` leaves optional and adds the
 * notes, tasks, timeline and AI collections. The backend job endpoints carry
 * none of those collections, so they start empty and each one is filled by
 * its own task. Callers that own extra detail data spread their own on top.
 *
 * @param {TJob} job Base job payload.
 * @returns {TJobDetail} Job detail record with empty detail collections.
 */
export const mapJobToJobDetail = (job: TJob): TJobDetail => ({
  ...job,
  description: job.description ?? '',
  jobUrl: job.jobUrl ?? '',
  location: job.location ?? '',
  salaryMax: job.salaryMax ?? 0,
  salaryMin: job.salaryMin ?? 0,
  aiInsights: {
    summary: '',
    strengths: [],
    gaps: [],
  },
  contacts: [],
  notes: [],
  tasks: [],
  timeline: [],
});
