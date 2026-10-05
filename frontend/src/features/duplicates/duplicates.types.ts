import type { TJob } from '../../types';

/**
 * How likely something is to duplicate a saved job.
 */
export type TDuplicateClassification = 'NEW' | 'POSSIBLE_DUPLICATE' | 'LIKELY_DUPLICATE';

/**
 * Which rule matched.
 */
export type TDuplicateReason =
  | 'SAME_URL'
  | 'SAME_COMPANY_AND_ROLE'
  | 'SIMILAR_ROLE_SAME_COMPANY'
  | 'SAME_ROLE_AND_LOCATION';

/**
 * The fields duplicate detection compares. A candidate, a job form, or a
 * job all reduce to this.
 */
export interface IDuplicateCheckInput {
  company: string;
  location?: string;
  roleTitle: string;
  url?: string | null;
}

/**
 * The strongest match found, if any: its classification, the rule, and
 * the saved job it matched.
 */
export interface IDuplicateResult {
  classification: TDuplicateClassification;
  job?: TJob;
  reason?: TDuplicateReason;
}
