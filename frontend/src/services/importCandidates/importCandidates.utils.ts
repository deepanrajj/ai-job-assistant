import { translate } from '../../i18n';
import {
  IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TImportCandidateFallbackErrorKey,
  type TSaveImportCandidateRequest,
} from './importCandidates.types';
import { toNullableTrimmed } from '../contacts';

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
