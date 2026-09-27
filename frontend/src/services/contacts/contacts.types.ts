import type { TJobContactType } from '../../types';

/**
 * Translation keys used for contact service fallback errors.
 */
export const CONTACT_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listContacts: 'contacts.fallbackError.listContacts',
  createContact: 'contacts.fallbackError.createContact',
  updateContact: 'contacts.fallbackError.updateContact',
  deleteContact: 'contacts.fallbackError.deleteContact',
} as const;

/**
 * Supported contact fallback error lookup keys.
 */
export type TContactFallbackErrorKey = keyof typeof CONTACT_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Wire representation of a contact exactly as
 * `/api/jobs/{jobId}/contacts` returns it.
 *
 * Excludes `jobId`: every route already carries it in the path, so the
 * backend does not repeat it in the response body. The backend sends
 * `null` rather than omitting empty optional fields.
 */
export type TContactResponse = {
  id: string;
  type: TJobContactType;
  name: string;
  email: string | null;
  phone: string | null;
  profileUrl: string | null;
  lastContactedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/jobs/{jobId}/contacts`.
 *
 * `type` and `name` are required; every other field must be sent, but may
 * be null.
 */
export type TCreateContactRequest = {
  type: TJobContactType;
  name: string;
  email: string | null;
  phone: string | null;
  profileUrl: string | null;
  lastContactedAt: string | null;
  notes: string | null;
};

/**
 * Request body accepted by `PUT /api/jobs/{jobId}/contacts/{contactId}`.
 *
 * A full replacement, the same shape as create, matching how notes' `PUT`
 * works.
 */
export type TUpdateContactRequest = TCreateContactRequest;
