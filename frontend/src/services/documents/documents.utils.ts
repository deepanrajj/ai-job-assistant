import { toOptional } from '../api';
import { translate } from '../../i18n';
import type { TJobDocument, TJobDocumentType } from '../../types';
import {
  DOCUMENT_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TCreateDocumentRequest,
  type TDocumentFallbackErrorKey,
  type TDocumentResponse,
} from './documents.types';
import { isValidProfileUrl, toNullableTrimmed } from '../contacts';

/**
 * Resolves the localized fallback error message for a document service operation.
 *
 * @param {TDocumentFallbackErrorKey} key Document operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getDocumentFallbackErrorMessage = (key: TDocumentFallbackErrorKey): string =>
  translate(DOCUMENT_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Converts a document API response into the document model the UI renders.
 *
 * @param {TDocumentResponse} response Document exactly as the API returned it.
 * @returns {TJobDocument} Document in the shape every screen consumes.
 */
export const mapDocumentResponseToJobDocument = (response: TDocumentResponse): TJobDocument => ({
  id: response.id,
  type: response.type,
  title: response.title,
  url: toOptional(response.url),
  submittedAt: toOptional(response.submittedAt),
  notes: toOptional(response.notes),
});

/**
 * Checks whether a document link is blank or starts with `http://` or
 * `https://`. The link is rendered as an anchor, so any other scheme,
 * `javascript:` included, is refused here as well as by the API. Same rule
 * as a contact's profile URL, so the check is shared rather than copied.
 *
 * @param {string} value Raw link field text.
 * @returns {boolean} True when the value is blank or an http(s) link.
 */
export const isValidDocumentUrl = (value: string): boolean => isValidProfileUrl(value);

/**
 * Raw field values a document form collects before they are sent.
 */
export interface IDocumentFormValues {
  notes: string;
  submittedAt: string;
  title: string;
  type: TJobDocumentType;
  url: string;
}

/**
 * Checks whether a document form is ready to submit: a non-blank title and
 * a blank or http(s) link. Gates the add button and a row's save button.
 *
 * @param {IDocumentFormValues} values Raw document form field values.
 * @returns {boolean} True when the form is ready to submit.
 */
export const isDocumentFormValid = (values: IDocumentFormValues): boolean =>
  Boolean(values.title.trim()) && isValidDocumentUrl(values.url);

/**
 * Builds a create/update request body from raw form values, trimming text
 * and sending blank optional fields as null.
 *
 * @param {IDocumentFormValues} values Raw document form field values.
 * @returns {TCreateDocumentRequest} Request body ready to send to the backend.
 */
export const buildDocumentRequestPayload = (
  values: IDocumentFormValues,
): TCreateDocumentRequest => ({
  type: values.type,
  title: values.title.trim(),
  url: toNullableTrimmed(values.url),
  submittedAt: values.submittedAt ? values.submittedAt : null,
  notes: toNullableTrimmed(values.notes),
});
