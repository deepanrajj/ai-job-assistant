import type { TJobStatus } from '../../types';

/**
 * Translation keys used for timeline service fallback errors.
 */
export const TIMELINE_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listTimeline: 'timeline.fallbackError.listTimeline',
} as const;

/**
 * Supported timeline fallback error lookup keys.
 */
export type TTimelineFallbackErrorKey = keyof typeof TIMELINE_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Supported timeline event types exactly as the backend's
 * `TimelineEventType` enum names them.
 */
export type TTimelineEventType = 'STATUS_CHANGE';

/**
 * Wire representation of a timeline event exactly as
 * `/api/jobs/{jobId}/timeline` returns it.
 *
 * Excludes `jobId`: every route already carries it in the path, so the
 * backend does not repeat it in the response body.
 */
export type TTimelineEventResponse = {
  id: string;
  type: TTimelineEventType;
  description: string;
  previousStatus: TJobStatus | null;
  nextStatus: TJobStatus | null;
  createdAt: string;
};
