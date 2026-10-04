import { getJson } from '../api';
import { getTimelineFallbackErrorMessage } from './timeline.utils';
import { APP_ERROR_CODES } from '../../types';
import type { TTimelineEventPageResponse, TTimelineEventResponse } from './timeline.types';

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

/**
 * The largest page `GET /api/timeline-events` serves; the backend clamps
 * `size` to it.
 */
export const TIMELINE_EVENTS_PAGE_SIZE = 100;

/**
 * Fetches one page of every job's timeline events, oldest first.
 *
 * @param {number} page Zero-based page number.
 * @returns {Promise<TTimelineEventPageResponse>} The page as the API returns it.
 */
const getTimelineEventPage = (page: number): Promise<TTimelineEventPageResponse> =>
  getJson<TTimelineEventPageResponse>(
    `/api/timeline-events?page=${page}&size=${TIMELINE_EVENTS_PAGE_SIZE}`,
    {
      errorCode: APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
      fallbackErrorMessage: getTimelineFallbackErrorMessage('listAllTimeline'),
    },
  );

/**
 * Fetches every job's complete status history: the first page, then every
 * remaining page in parallel. Rejects if any page fails, so a caller never
 * computes from part of the history.
 *
 * Events are de-duplicated by id. The endpoint orders oldest first, so new
 * events land on the last page and earlier pages stay put while this
 * runs; a job deleted mid-read can still shift a row onto the next page.
 *
 * @returns {Promise<TTimelineEventResponse[]>} Every event, each exactly once.
 */
export const getAllTimelineEvents = async (): Promise<TTimelineEventResponse[]> => {
  const firstPage = await getTimelineEventPage(0);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) =>
      getTimelineEventPage(index + 1),
    ),
  );
  const eventsById = new Map<string, TTimelineEventResponse>();

  for (const page of [firstPage, ...remainingPages])
    for (const event of page.content) eventsById.set(event.id, event);

  return [...eventsById.values()];
};
