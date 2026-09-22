import type { TTimelineEventResponse } from '../services';

/**
 * Ids of the timeline events a test can address without hardcoding a UUID,
 * mirroring `MOCK_NOTE_IDS` in `mockNotes.ts`.
 */
export const MOCK_TIMELINE_EVENT_IDS = {
  primary: 'e3333333-3333-4333-8333-333333333333',
  secondary: 'f4444444-4444-4444-8444-444444444444',
} as const;

/**
 * Creates a mock wire timeline event, shaped exactly as
 * `GET /api/jobs/{jobId}/timeline` returns one.
 *
 * @param {Partial<TTimelineEventResponse>} overrides Wire fields that should differ from the default.
 * @returns {TTimelineEventResponse} Mock timeline event suitable for API-backed tests.
 */
export const createMockTimelineEventResponse = (
  overrides: Partial<TTimelineEventResponse> = {},
): TTimelineEventResponse => ({
  id: MOCK_TIMELINE_EVENT_IDS.primary,
  type: 'STATUS_CHANGE',
  description: 'Status changed from APPLIED to INTERVIEW.',
  previousStatus: 'APPLIED',
  nextStatus: 'INTERVIEW',
  createdAt: '2026-05-01T09:00:00.123456Z',
  ...overrides,
});
