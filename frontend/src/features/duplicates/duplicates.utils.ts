import type { TJob } from '../../types';
import type {
  IDuplicateCheckInput,
  IDuplicateResult,
  TDuplicateClassification,
  TDuplicateReason,
} from './duplicates.types';

/**
 * Legal-form words a company name may carry or omit: "N26 GmbH" and
 * "N26" are the same employer.
 */
const COMPANY_SUFFIXES = new Set([
  'ag',
  'co',
  'company',
  'corp',
  'corporation',
  'gmbh',
  'inc',
  'kg',
  'ltd',
  'llc',
  'plc',
  'se',
]);

/**
 * Share of role-title words two titles must have in common to count as
 * similar: "Senior Backend Engineer" and "Backend Engineer" share two of
 * three.
 */
const SIMILAR_ROLE_WORD_SHARE = 0.5;

const RANK: Record<TDuplicateClassification, number> = {
  NEW: 0,
  POSSIBLE_DUPLICATE: 1,
  LIKELY_DUPLICATE: 2,
};

/**
 * Normalizes free text for comparison: lower-cased, accents removed,
 * punctuation turned into spaces, whitespace collapsed.
 *
 * @param {string | undefined} value Raw text.
 * @returns {string} Comparable text, possibly empty.
 */
export const normalizeDuplicateText = (value: string | undefined): string =>
  (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Normalizes a company name: as `normalizeDuplicateText`, without legal
 * suffixes such as GmbH or Inc.
 *
 * @param {string} value Raw company name.
 * @returns {string} Comparable company name.
 */
export const normalizeCompany = (value: string): string =>
  normalizeDuplicateText(value)
    .split(' ')
    .filter((word) => word && !COMPANY_SUFFIXES.has(word))
    .join(' ');

/**
 * Normalizes a job URL so the same posting compares equal however it was
 * copied: host lower-cased without `www.`, no trailing slash, no
 * fragment, no `utm_*` tracking parameters, scheme ignored. Other query
 * parameters stay, since some boards identify the job by them.
 *
 * @param {string | null | undefined} value Raw URL.
 * @returns {string} Comparable URL, or empty for a missing or unparseable one.
 */
export const normalizeJobUrl = (value: string | null | undefined): string => {
  if (!value?.trim()) return '';

  try {
    const url = new URL(value.trim());
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !key.toLowerCase().startsWith('utm_'))
      .sort(([left], [right]) => left.localeCompare(right));
    const query = new URLSearchParams(params).toString();
    const path = url.pathname.replace(/\/+$/, '');

    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${path}${query ? `?${query}` : ''}`;
  } catch {
    return '';
  }
};

/**
 * Checks whether two normalized role titles share at least
 * `SIMILAR_ROLE_WORD_SHARE` of the longer title's words.
 *
 * @param {string} left Normalized role title.
 * @param {string} right Normalized role title.
 * @returns {boolean} True when the titles are similar.
 */
const areRolesSimilar = (left: string, right: string): boolean => {
  const leftWords = new Set(left.split(' ').filter(Boolean));
  const rightWords = new Set(right.split(' ').filter(Boolean));
  const shared = [...leftWords].filter((word) => rightWords.has(word)).length;
  const longest = Math.max(leftWords.size, rightWords.size);

  return longest > 0 && shared / longest >= SIMILAR_ROLE_WORD_SHARE;
};

/**
 * Applies the rules to one saved job, strongest rule first.
 *
 * @param {IDuplicateCheckInput} input What is being checked.
 * @param {TJob} job A saved job.
 * @returns {IDuplicateResult} The classification against that job.
 */
const classifyAgainstJob = (input: IDuplicateCheckInput, job: TJob): IDuplicateResult => {
  const match = (
    classification: TDuplicateClassification,
    reason: TDuplicateReason,
  ): IDuplicateResult => ({ classification, job, reason });
  const inputUrl = normalizeJobUrl(input.url);
  const company = normalizeCompany(input.company);
  const role = normalizeDuplicateText(input.roleTitle);
  const location = normalizeDuplicateText(input.location);
  const jobCompany = normalizeCompany(job.company);
  const jobRole = normalizeDuplicateText(job.roleTitle);
  const sameCompany = Boolean(company) && company === jobCompany;
  const sameRole = Boolean(role) && role === jobRole;

  if (inputUrl && inputUrl === normalizeJobUrl(job.jobUrl))
    return match('LIKELY_DUPLICATE', 'SAME_URL');
  if (sameCompany && sameRole) return match('LIKELY_DUPLICATE', 'SAME_COMPANY_AND_ROLE');
  if (sameCompany && areRolesSimilar(role, jobRole))
    return match('POSSIBLE_DUPLICATE', 'SIMILAR_ROLE_SAME_COMPANY');
  if (sameRole && Boolean(location) && location === normalizeDuplicateText(job.location))
    return match('POSSIBLE_DUPLICATE', 'SAME_ROLE_AND_LOCATION');

  return { classification: 'NEW' };
};

/**
 * Classifies something against every saved job and returns the strongest
 * match: a likely duplicate over a possible one, and the first saved job
 * among equals. Deterministic, so the same inputs always give the same
 * answer and the reason can be shown.
 *
 * @param {IDuplicateCheckInput} input What is being checked: a candidate, or a job form.
 * @param {TJob[]} jobs Saved jobs.
 * @returns {IDuplicateResult} The strongest match, or NEW.
 */
export const classifyDuplicate = (input: IDuplicateCheckInput, jobs: TJob[]): IDuplicateResult =>
  jobs.reduce<IDuplicateResult>(
    (best, job) => {
      const result = classifyAgainstJob(input, job);

      return RANK[result.classification] > RANK[best.classification] ? result : best;
    },
    { classification: 'NEW' },
  );
