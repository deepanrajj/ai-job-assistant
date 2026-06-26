import type { TLanguage } from '../../i18n';
import type { TJob } from '../../types';

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
  const salaryMin = job.salaryMin !== undefined && job.salaryMin > 0 ? job.salaryMin : undefined;
  const salaryMax = job.salaryMax !== undefined && job.salaryMax > 0 ? job.salaryMax : undefined;
  const salary = salaryMin ?? salaryMax;

  if (salary === undefined) return null;

  return salaryMin !== undefined && salaryMax !== undefined
    ? `EUR ${salaryMin / 1000}k - EUR ${salaryMax / 1000}k`
    : `EUR ${salary / 1000}k`;
};
