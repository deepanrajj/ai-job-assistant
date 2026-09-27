import { translate } from '../../i18n';
import type { TJobContact, TJobContactType } from '../../types';
import {
  CONTACT_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TContactFallbackErrorKey,
  type TContactResponse,
  type TCreateContactRequest,
} from './contacts.types';

/**
 * Resolves the localized fallback error message for a contact service operation.
 *
 * @param {TContactFallbackErrorKey} key Contact operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getContactFallbackErrorMessage = (key: TContactFallbackErrorKey): string =>
  translate(CONTACT_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Converts a wire null into the undefined the UI model uses.
 *
 * @param {TValue | null} value Wire value that may be null.
 * @returns {TValue | undefined} Undefined when the value was null.
 */
const toOptional = <TValue>(value: TValue | null): TValue | undefined => value ?? undefined;

/**
 * Converts a value the user typed into the null the backend expects for
 * "not set": trims the text and treats a blank result the same as an
 * absent one. Mirrors what the backend's `toCommand()` does with a blank
 * optional field, so "blank optional fields are handled" holds for any
 * client, not just this one.
 *
 * @param {string} value Raw form field text.
 * @returns {string | null} The trimmed value, or null when it was blank.
 */
export const toNullableTrimmed = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
};

/**
 * Converts a contact API response into the contact model the UI renders.
 *
 * @param {TContactResponse} response Contact exactly as `/api/jobs/{jobId}/contacts` returned it.
 * @returns {TJobContact} Contact in the shape every screen consumes.
 */
export const mapContactResponseToJobContact = (response: TContactResponse): TJobContact => ({
  id: response.id,
  type: response.type,
  name: response.name,
  email: toOptional(response.email),
  phone: toOptional(response.phone),
  profileUrl: toOptional(response.profileUrl),
  lastContactedAt: toOptional(response.lastContactedAt),
  notes: toOptional(response.notes),
});

/**
 * Raw field values a contact form collects before they are sent.
 */
export interface IContactFormValues {
  email: string;
  lastContactedAt: string;
  name: string;
  notes: string;
  phone: string;
  profileUrl: string;
  type: TJobContactType;
}

/**
 * Builds a create/update request body from raw contact form values,
 * trimming text and converting blank optional fields to null.
 *
 * @param {IContactFormValues} values Raw contact form field values.
 * @returns {TCreateContactRequest} Request body ready to send to the backend.
 */
export const buildContactRequestPayload = (values: IContactFormValues): TCreateContactRequest => ({
  type: values.type,
  name: values.name.trim(),
  email: toNullableTrimmed(values.email),
  phone: toNullableTrimmed(values.phone),
  profileUrl: toNullableTrimmed(values.profileUrl),
  lastContactedAt: values.lastContactedAt ? values.lastContactedAt : null,
  notes: toNullableTrimmed(values.notes),
});
