import { translate } from '../../i18n';
import type { TJobSource } from '../../types';
import {
  IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TImportCandidateFallbackErrorKey,
  type TImportCandidateResponse,
  type TSaveImportCandidateRequest,
} from './importCandidates.types';
import { isValidProfileUrl, toNullableTrimmed } from '../contacts';
import type { TCreateJobRequest } from '../jobs';

/**
 * Resolves the localized fallback error message for an import candidate operation.
 *
 * @param {TImportCandidateFallbackErrorKey} key Operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getImportCandidateFallbackErrorMessage = (
  key: TImportCandidateFallbackErrorKey,
): string => translate(IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Raw values the intake form collects.
 */
export interface IImportCandidateFormValues {
  company: string;
  description: string;
  location: string;
  roleTitle: string;
  sourceUrl: string;
}

/**
 * Which intake fields currently block saving, and why.
 */
export interface IImportCandidateFormErrors {
  company?: 'required';
  description?: 'required';
  roleTitle?: 'required';
  sourceUrl?: 'invalidUrl';
}

/**
 * An empty intake form.
 *
 * @returns {IImportCandidateFormValues} Empty values.
 */
export const createEmptyImportCandidateForm = (): IImportCandidateFormValues => ({
  company: '',
  description: '',
  location: '',
  roleTitle: '',
  sourceUrl: '',
});

/**
 * Checks the intake form: company, role, and description must not be
 * blank, and a source link, when given, must be `http(s)`. The link is
 * only ever stored and shown, never requested.
 *
 * @param {IImportCandidateFormValues} values Raw form values.
 * @returns {IImportCandidateFormErrors} The blocking problems, empty when none.
 */
export const validateImportCandidateForm = (
  values: IImportCandidateFormValues,
): IImportCandidateFormErrors => ({
  ...(values.company.trim() ? {} : { company: 'required' as const }),
  ...(values.description.trim() ? {} : { description: 'required' as const }),
  ...(values.roleTitle.trim() ? {} : { roleTitle: 'required' as const }),
  ...(isValidProfileUrl(values.sourceUrl) ? {} : { sourceUrl: 'invalidUrl' as const }),
});

/**
 * Builds the request body from form values: text trimmed, an empty
 * location or link sent as empty or null.
 *
 * @param {IImportCandidateFormValues} values Raw form values.
 * @returns {TSaveImportCandidateRequest} Request body.
 */
export const buildImportCandidateRequest = (
  values: IImportCandidateFormValues,
): TSaveImportCandidateRequest => ({
  content: {
    company: values.company.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    roleTitle: values.roleTitle.trim(),
  },
  sourceUrl: toNullableTrimmed(values.sourceUrl),
});

/**
 * Job boards whose links name them unambiguously, by host suffix. Any
 * other host - a company careers page, an aggregator - is left unknown
 * rather than guessed.
 */
const SOURCE_BY_HOST: readonly (readonly [RegExp, TJobSource])[] = [
  [/(^|\.)linkedin\.com$/, 'LINKEDIN'],
  [/(^|\.)indeed\.[a-z.]+$/, 'INDEED'],
  [/(^|\.)xing\.com$/, 'XING'],
];

/**
 * Infers a job's source from its link, only where the host says it.
 *
 * @param {string | null} url Candidate source link.
 * @returns {TJobSource | null} The board, or null when it cannot be told.
 */
export const inferJobSourceFromUrl = (url: string | null): TJobSource | null => {
  if (!url) return null;

  try {
    const host = new URL(url).hostname.toLowerCase();

    return SOURCE_BY_HOST.find(([pattern]) => pattern.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
};

/**
 * How an imported candidate becomes a job: its content, its link as the
 * job URL, the status `WISHLIST` (saved, not applied), and the source
 * inferred from the link. The backend's import follows the same mapping;
 * the dev mock uses this one.
 *
 * @param {TImportCandidateResponse} candidate Candidate being imported.
 * @returns {TCreateJobRequest} The job to create.
 */
export const mapCandidateToJobRequest = (
  candidate: TImportCandidateResponse,
): TCreateJobRequest => ({
  company: candidate.content.company,
  description: candidate.content.description,
  jobUrl: candidate.sourceUrl,
  location: candidate.content.location || null,
  roleTitle: candidate.content.roleTitle,
  source: inferJobSourceFromUrl(candidate.sourceUrl),
  status: 'WISHLIST',
});
