import { translate } from '../../i18n';
import type { TJobTimelineEvent } from '../../types';
import {
  TIMELINE_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TTimelineEventResponse,
  type TTimelineEventType,
  type TTimelineFallbackErrorKey,
} from './timeline.types';

/**
 * Resolves the localized fallback error message for a timeline service operation.
 *
 * @param {TTimelineFallbackErrorKey} key Timeline operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getTimelineFallbackErrorMessage = (key: TTimelineFallbackErrorKey): string =>
  translate(TIMELINE_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Translation keys used for a timeline event's rendered title, keyed on the
 * wire's `type`. The backend has only ever written `STATUS_CHANGE` events
 * (verified against `JobService.updateJob`), but keying on the type rather
 * than hardcoding one title means a second `TimelineEventType` the backend
 * adds later fails to compile here instead of silently rendering no title.
 */
export const TIMELINE_EVENT_TYPE_TITLE_TRANSLATION_KEYS: Record<TTimelineEventType, string> = {
  STATUS_CHANGE: 'jobDetail.timeline.eventType.statusChange',
};

/**
 * Converts a timeline event API response into the model the UI renders.
 *
 * Drops `previousStatus` and `nextStatus`, which `TJobTimelineEvent` has no
 * field for; `description` already states both statuses in prose. `title`
 * has no wire counterpart, so it is derived from `type`.
 *
 * @param {TTimelineEventResponse} response Timeline event exactly as `/api/jobs/{jobId}/timeline` returned it.
 * @returns {TJobTimelineEvent} Timeline event in the shape every screen consumes.
 */
export const mapTimelineEventResponseToJobTimelineEvent = (
  response: TTimelineEventResponse,
): TJobTimelineEvent => ({
  id: response.id,
  title: translate(TIMELINE_EVENT_TYPE_TITLE_TRANSLATION_KEYS[response.type]),
  description: response.description,
  createdAt: response.createdAt,
});
