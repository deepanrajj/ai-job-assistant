import { getJson } from '../api';
import { getTimelineFallbackErrorMessage } from './timeline.utils';
import { AppError } from '../../errors';
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
 * How many times `getAllTimelineEvents` reads the history before giving up
 * on getting a consistent one.
 */
const MAX_HISTORY_READ_ATTEMPTS = 2;

/**
 * Reads every page once: the first page, then every remaining page in
 * parallel. Returns null when the pages disagree, so the caller can retry.
 *
 * The pages agree when every one reports the same `totalElements` and the
 * distinct events collected number exactly that. A change between reads
 * breaks it either way. A deleted job takes its events with it, so later
 * rows move back onto pages already read and are skipped, and later pages
 * report a smaller total. A new event can push the history onto a page
 * that was never requested, and later pages report a larger total. Both
 * would otherwise return part of the history without any error.
 *
 * Distinct ids are counted because a row can also appear twice. A deletion
 * and an addition that exactly cancel out between two reads are not
 * detected; that needs two changes inside one sub-second read.
 *
 * @returns {Promise<TTimelineEventResponse[] | null>} Every event once, or null when the pages disagree.
 */
const readTimelineEventsOnce = async (): Promise<TTimelineEventResponse[] | null> => {
  const firstPage = await getTimelineEventPage(0);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) =>
      getTimelineEventPage(index + 1),
    ),
  );
  const pages = [firstPage, ...remainingPages];
  const eventsById = new Map<string, TTimelineEventResponse>();

  for (const page of pages) for (const event of page.content) eventsById.set(event.id, event);

  const isConsistent =
    pages.every((page) => page.totalElements === firstPage.totalElements) &&
    eventsById.size === firstPage.totalElements;

  return isConsistent ? [...eventsById.values()] : null;
};

/**
 * Fetches every job's complete status history. Rejects if any page fails,
 * or if the history changed during the read on every attempt, so a caller
 * never computes from part of it. See `readTimelineEventsOnce` for how a
 * change is detected.
 *
 * @returns {Promise<TTimelineEventResponse[]>} Every event, each exactly once.
 */
export const getAllTimelineEvents = async (): Promise<TTimelineEventResponse[]> => {
  for (let attempt = 1; attempt <= MAX_HISTORY_READ_ATTEMPTS; attempt += 1) {
    const events = await readTimelineEventsOnce();

    if (events) return events;
  }

  throw new AppError(
    getTimelineFallbackErrorMessage('listAllTimeline'),
    APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
  );
};
