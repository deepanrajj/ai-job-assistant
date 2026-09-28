import type { TContactResponse } from '../services';

/**
 * Ids of the contacts a test can address without hardcoding a UUID,
 * mirroring `MOCK_NOTE_IDS` in `mockNotes.ts`.
 */
export const MOCK_CONTACT_IDS = {
  primary: 'e1111111-1111-4111-8111-111111111111',
  secondary: 'f2222222-2222-4222-8222-222222222222',
} as const;

/**
 * Creates a mock wire contact, shaped exactly as
 * `GET /api/jobs/{jobId}/contacts` returns one.
 *
 * @param {Partial<TContactResponse>} overrides Wire fields that should differ from the default.
 * @returns {TContactResponse} Mock contact response suitable for API-backed tests.
 */
export const createMockContactResponse = (
  overrides: Partial<TContactResponse> = {},
): TContactResponse => ({
  id: MOCK_CONTACT_IDS.primary,
  type: 'RECRUITER',
  name: 'Jane Recruiter',
  email: 'jane@example.com',
  phone: null,
  profileUrl: null,
  lastContactedAt: null,
  notes: null,
  createdAt: '2026-05-01T09:00:00.123456Z',
  updatedAt: '2026-05-01T09:00:00.123456Z',
  ...overrides,
});
