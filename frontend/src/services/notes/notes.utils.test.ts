import { describe, expect, it } from 'vitest';

import { mapNoteResponseToJobNote } from './notes.utils';
import type { TNoteResponse } from './notes.types';

const response: TNoteResponse = {
  id: 'note-001',
  body: 'Recruiter called back',
  createdAt: '2026-05-01T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
};

describe('mapNoteResponseToJobNote', () => {
  it('maps id, body, and createdAt, dropping updatedAt', () => {
    expect(mapNoteResponseToJobNote(response)).toEqual({
      id: 'note-001',
      body: 'Recruiter called back',
      createdAt: '2026-05-01T09:00:00.000Z',
    });
  });
});
