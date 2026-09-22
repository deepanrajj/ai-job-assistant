import type { TNoteResponse } from '../services';

/**
 * Ids of the notes a test can address without hardcoding a UUID, mirroring
 * `MOCK_TASK_IDS` in `mockTasks.ts`.
 */
export const MOCK_NOTE_IDS = {
  primary: 'c1111111-1111-4111-8111-111111111111',
  secondary: 'd2222222-2222-4222-8222-222222222222',
} as const;

/**
 * Creates a mock wire note, shaped exactly as
 * `GET /api/jobs/{jobId}/notes` returns one.
 *
 * @param {Partial<TNoteResponse>} overrides Wire fields that should differ from the default.
 * @returns {TNoteResponse} Mock note response suitable for API-backed tests.
 */
export const createMockNoteResponse = (overrides: Partial<TNoteResponse> = {}): TNoteResponse => ({
  id: MOCK_NOTE_IDS.primary,
  body: 'Recruiter called back',
  createdAt: '2026-05-01T09:00:00.123456Z',
  updatedAt: '2026-05-01T09:00:00.123456Z',
  ...overrides,
});
