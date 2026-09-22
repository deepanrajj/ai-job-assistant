import { getJson } from '../api';
import { getTimelineFallbackErrorMessage } from './timeline.utils';
import { APP_ERROR_CODES } from '../../types';
import type { TTimelineEventResponse } from './timeline.types';

/**
 * Builds the endpoint URL for a job's timeline.
 *
 * The job id is encoded because it reaches this service from a route param,
 * and an unencoded one does not stay a path segment.
 *
 * @param {string} jobId Job identifier.
 * @returns {string} Endpoint URL for that job's timeline.
 */
const getTimelineEndpoint = (jobId: string): string =>
  `/api/jobs/${encodeURIComponent(jobId)}/timeline`;

/**
 * Fetches a job's timeline events, oldest first.
 *
 * @param {string} jobId Job identifier.
 * @returns {Promise<TTimelineEventResponse[]>} Timeline events as the API returns them.
 */
export const getTimelineEvents = (jobId: string): Promise<TTimelineEventResponse[]> =>
  getJson<TTimelineEventResponse[]>(getTimelineEndpoint(jobId), {
    errorCode: APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
    fallbackErrorMessage: getTimelineFallbackErrorMessage('listTimeline'),
  });
