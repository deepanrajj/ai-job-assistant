import { translate } from '../../i18n';
import {
  IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TImportCandidateFallbackErrorKey,
  type TSaveImportCandidateRequest,
} from './importCandidates.types';
import { isValidProfileUrl, toNullableTrimmed } from '../contacts';

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
