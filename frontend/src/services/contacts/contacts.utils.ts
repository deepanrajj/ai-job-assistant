import { toOptional } from '../api';
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
 * Checks whether a profile URL field is blank or starts with `http://` or
 * `https://` and nothing else follows on a line of its own, mirroring the
 * backend's `@Pattern` on `profileUrl` (`PROFILE_URL_PATTERN` in
 * `ContactFieldLimits.kt`), which requires the *whole* trimmed value to
 * match, not just its start. Rendered as a link, a bare scheme-less value
 * would either fail to open or, worse, accept a scheme such as
 * `javascript:`, so this is checked on the frontend form in addition to
 * the backend that already rejects it.
 *
 * The trailing `$` matters beyond symmetry with the backend: without it,
 * a value starting with `https://` but containing an embedded newline
 * (`.` does not match `\n`) would pass an unanchored prefix test here
 * while still failing the backend's full-string match, letting the UI
 * show a value as valid that a submit would then reject.
 *
 * Whitespace-only counts as blank on both sides, on purpose:
 * `PROFILE_URL_PATTERN` matches `^\s*$` for exactly that reason. Nothing
 * outside these two hand-kept-in-sync places enforces the match; a
 * change to either regex should be checked against the other, and
 * against `contacts.utils.test.ts` and `ContactControllerTest.kt`, whose
 * example URLs are meant to agree between the two languages.
 *
 * @param {string} value Raw profile URL form field text.
 * @returns {boolean} True when the value is blank or starts with http(s).
 */
export const isValidProfileUrl = (value: string): boolean => {
  const trimmed = value.trim();

  return !trimmed || /^https?:\/\/.*$/i.test(trimmed);
};

/**
 * Checks whether an email field is blank or a plausible address, mirroring
 * the backend's `@Email` on `email`. It is intentionally looser than a
 * fully RFC-compliant check - like Bean Validation's own `@Email`, this
 * only needs to catch the obviously malformed case before a round trip to
 * the server, not police every edge case an address format allows.
 *
 * @param {string} value Raw email form field text.
 * @returns {boolean} True when the value is blank or looks like an email address.
 */
export const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();

  return !trimmed || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
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
 * Checks whether a contact form's client-side-checkable fields are ready to
 * submit: a non-blank name, and an email/profile URL that are either blank
 * or well-formed. Used to gate both the add-contact submit button and a
 * row's save button, so the two call sites cannot drift on what counts as
 * valid the way three separate inline calls to `isValidProfileUrl` could.
 *
 * @param {IContactFormValues} values Raw contact form field values.
 * @returns {boolean} True when the form is ready to submit.
 */
export const isContactFormValid = (values: IContactFormValues): boolean =>
  Boolean(values.name.trim()) && isValidEmail(values.email) && isValidProfileUrl(values.profileUrl);

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
