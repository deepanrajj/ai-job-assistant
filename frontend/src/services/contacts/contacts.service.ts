import { deleteJson, getJson, postJson, putJson } from '../api';
import { getContactFallbackErrorMessage } from './contacts.utils';
import { APP_ERROR_CODES } from '../../types';
import type {
  TContactResponse,
  TCreateContactRequest,
  TUpdateContactRequest,
} from './contacts.types';

/**
 * Builds the endpoint URL for a job's contacts.
 *
 * The job id is encoded because it reaches this service from a route param,
 * and an unencoded one does not stay a path segment.
 *
 * @param {string} jobId Job identifier.
 * @returns {string} Endpoint URL for that job's contacts.
 */
const getContactsEndpoint = (jobId: string): string =>
  `/api/jobs/${encodeURIComponent(jobId)}/contacts`;

/**
 * Builds the endpoint URL for a single contact under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {string} contactId Contact identifier.
 * @returns {string} Endpoint URL for that contact.
 */
const getContactEndpoint = (jobId: string, contactId: string): string =>
  `${getContactsEndpoint(jobId)}/${encodeURIComponent(contactId)}`;

/**
 * Fetches a job's contacts, oldest first.
 *
 * @param {string} jobId Job identifier.
 * @returns {Promise<TContactResponse[]>} Contacts as the API returns them.
 */
export const getContacts = (jobId: string): Promise<TContactResponse[]> =>
  getJson<TContactResponse[]>(getContactsEndpoint(jobId), {
    errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
    fallbackErrorMessage: getContactFallbackErrorMessage('listContacts'),
  });

/**
 * Creates a contact under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {TCreateContactRequest} payload Contact creation request body.
 * @returns {Promise<TContactResponse>} The created contact, including its server-assigned id.
 */
export const createContact = (
  jobId: string,
  payload: TCreateContactRequest,
): Promise<TContactResponse> =>
  postJson<TContactResponse, TCreateContactRequest>(getContactsEndpoint(jobId), payload, {
    errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
    fallbackErrorMessage: getContactFallbackErrorMessage('createContact'),
  });

/**
 * Replaces every editable field of a contact.
 *
 * @param {string} jobId Job identifier.
 * @param {string} contactId Contact identifier.
 * @param {TUpdateContactRequest} payload Complete replacement request body.
 * @returns {Promise<TContactResponse>} The updated contact as the API returns it.
 */
export const updateContact = (
  jobId: string,
  contactId: string,
  payload: TUpdateContactRequest,
): Promise<TContactResponse> =>
  putJson<TContactResponse, TUpdateContactRequest>(getContactEndpoint(jobId, contactId), payload, {
    errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
    fallbackErrorMessage: getContactFallbackErrorMessage('updateContact'),
  });

/**
 * Deletes a contact.
 *
 * The API answers 204 with no body, so this resolves to undefined.
 *
 * @param {string} jobId Job identifier.
 * @param {string} contactId Contact identifier.
 * @returns {Promise<void>} Resolves once the contact is deleted.
 */
export const deleteContact = (jobId: string, contactId: string): Promise<void> =>
  deleteJson<void>(getContactEndpoint(jobId, contactId), {
    errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
    fallbackErrorMessage: getContactFallbackErrorMessage('deleteContact'),
  });
