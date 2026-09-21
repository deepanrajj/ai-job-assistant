import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createNote, deleteNote, getNotes, updateNote } from './notes.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TNoteResponse } from './notes.types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';
const NOTE_ID = 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d';

/**
 * A note exactly as the backend sends it.
 */
const noteResponse: TNoteResponse = {
  id: NOTE_ID,
  body: 'Recruiter called back',
  createdAt: '2026-09-10T18:50:40.881640926Z',
  updatedAt: '2026-09-10T18:50:40.881640926Z',
};

describe('notes.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([noteResponse]);
    vi.mocked(postJson).mockResolvedValue(noteResponse);
    vi.mocked(putJson).mockResolvedValue(noteResponse);
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it("requests a job's notes with the list error mapping", async () => {
    const notes = await getNotes(JOB_ID);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/notes`, {
      errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load notes',
    });
    expect(notes).toEqual([noteResponse]);
  });

  it('posts only the body field when creating a note', async () => {
    const note = await createNote(JOB_ID, { body: 'Recruiter called back' });

    expect(postJson).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}/notes`,
      { body: 'Recruiter called back' },
      {
        errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to create note',
      },
    );
    expect(note).toEqual(noteResponse);
  });

  it('replaces the body when updating a note', async () => {
    const note = await updateNote(JOB_ID, NOTE_ID, { body: 'Updated body' });

    expect(putJson).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}/notes/${NOTE_ID}`,
      { body: 'Updated body' },
      {
        errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to update note',
      },
    );
    expect(note).toEqual(noteResponse);
  });

  it('returns the delete result unchanged', async () => {
    const result = await deleteNote(JOB_ID, NOTE_ID);

    expect(deleteJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/notes/${NOTE_ID}`, {
      errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete note',
    });
    expect(result).toBeUndefined();
  });

  it.each([
    ['../ai/health', '..%2Fai%2Fhealth'],
    ['abc?x=1', 'abc%3Fx%3D1'],
    ['abc#frag', 'abc%23frag'],
  ])('encodes %s so it cannot escape the job path', async (rawJobId, encodedJobId) => {
    await getNotes(rawJobId);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${encodedJobId}/notes`, expect.anything());
  });

  it('encodes both the job id and the note id on a note route', async () => {
    await updateNote('../ai/health', '../other-job/notes/x', { body: 'Updated body' });
    await deleteNote('../ai/health', '../other-job/notes/x');

    const expectedUrl = '/api/jobs/..%2Fai%2Fhealth/notes/..%2Fother-job%2Fnotes%2Fx';

    expect(putJson).toHaveBeenCalledWith(expectedUrl, expect.anything(), expect.anything());
    expect(deleteJson).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.NOTE_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getNotes(JOB_ID)).rejects.toBe(apiError);
  });
});
