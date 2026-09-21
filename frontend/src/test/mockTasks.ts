import type { TTaskResponse } from '../services';

/**
 * Creates a mock wire task, shaped exactly as
 * `GET /api/jobs/{jobId}/tasks` returns one.
 *
 * A null due date, matching the backend, rather than an empty string, so a
 * test that goes through `mapTaskResponseToJobTask` exercises the
 * conversion instead of skipping past it.
 *
 * @param {Partial<TTaskResponse>} overrides Wire fields that should differ from the default.
 * @returns {TTaskResponse} Mock task response suitable for API-backed tests.
 */
export const createMockTaskResponse = (overrides: Partial<TTaskResponse> = {}): TTaskResponse => ({
  id: 'a1111111-1111-4111-8111-111111111111',
  title: 'Tailor CV bullets',
  status: 'TODO',
  dueDate: '2026-05-10',
  createdAt: '2026-05-01T09:00:00.123456Z',
  updatedAt: '2026-05-01T09:00:00.123456Z',
  ...overrides,
});
