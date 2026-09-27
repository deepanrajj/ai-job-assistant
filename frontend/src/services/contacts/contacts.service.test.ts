import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createContact, deleteContact, getContacts, updateContact } from './contacts.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TContactResponse } from './contacts.types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';
const CONTACT_ID = 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d';

/**
 * A contact exactly as the backend sends it.
 */
const contactResponse: TContactResponse = {
  id: CONTACT_ID,
  type: 'RECRUITER',
  name: 'Jane Recruiter',
  email: 'jane@example.com',
  phone: null,
  profileUrl: null,
  lastContactedAt: null,
  notes: null,
  createdAt: '2026-09-10T18:50:40.881640926Z',
  updatedAt: '2026-09-10T18:50:40.881640926Z',
};

const createRequest = {
  type: 'RECRUITER' as const,
  name: 'Jane Recruiter',
  email: 'jane@example.com',
  phone: null,
  profileUrl: null,
  lastContactedAt: null,
  notes: null,
};

describe('contacts.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([contactResponse]);
    vi.mocked(postJson).mockResolvedValue(contactResponse);
    vi.mocked(putJson).mockResolvedValue(contactResponse);
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it("requests a job's contacts with the list error mapping", async () => {
    const contacts = await getContacts(JOB_ID);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/contacts`, {
      errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load contacts',
    });
    expect(contacts).toEqual([contactResponse]);
  });

  it('posts every field when creating a contact', async () => {
    const contact = await createContact(JOB_ID, createRequest);

    expect(postJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/contacts`, createRequest, {
      errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to create contact',
    });
    expect(contact).toEqual(contactResponse);
  });

  it('replaces every field when updating a contact', async () => {
    const contact = await updateContact(JOB_ID, CONTACT_ID, createRequest);

    expect(putJson).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}/contacts/${CONTACT_ID}`,
      createRequest,
      {
        errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to update contact',
      },
    );
    expect(contact).toEqual(contactResponse);
  });

  it('returns the delete result unchanged', async () => {
    const result = await deleteContact(JOB_ID, CONTACT_ID);

    expect(deleteJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/contacts/${CONTACT_ID}`, {
      errorCode: APP_ERROR_CODES.CONTACT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete contact',
    });
    expect(result).toBeUndefined();
  });

  it.each([
    ['../ai/health', '..%2Fai%2Fhealth'],
    ['abc?x=1', 'abc%3Fx%3D1'],
    ['abc#frag', 'abc%23frag'],
  ])('encodes %s so it cannot escape the job path', async (rawJobId, encodedJobId) => {
    await getContacts(rawJobId);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${encodedJobId}/contacts`, expect.anything());
  });

  it('encodes both the job id and the contact id on a contact route', async () => {
    await updateContact('../ai/health', '../other-job/contacts/x', createRequest);
    await deleteContact('../ai/health', '../other-job/contacts/x');

    const expectedUrl = '/api/jobs/..%2Fai%2Fhealth/contacts/..%2Fother-job%2Fcontacts%2Fx';

    expect(putJson).toHaveBeenCalledWith(expectedUrl, expect.anything(), expect.anything());
    expect(deleteJson).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.CONTACT_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getContacts(JOB_ID)).rejects.toBe(apiError);
  });
});
