import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAllTimelineEvents, getTimelineEvents } from './timeline.service';
import { getJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TTimelineEventPageResponse, TTimelineEventResponse } from './timeline.types';

vi.mock('../api', () => ({
  getJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';

/**
 * A timeline event exactly as the backend sends it.
 */
const timelineEventResponse: TTimelineEventResponse = {
  id: 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d',
  jobId: '6d58e422-3f47-4fd3-b08c-84b3a75347fc',
  type: 'STATUS_CHANGE',
  description: 'Status changed from APPLIED to INTERVIEW.',
  previousStatus: 'APPLIED',
  nextStatus: 'INTERVIEW',
  createdAt: '2026-09-10T18:50:40.881640926Z',
};

describe('timeline.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([timelineEventResponse]);
  });

  it("requests a job's timeline with the list error mapping", async () => {
    const timeline = await getTimelineEvents(JOB_ID);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/timeline`, {
      errorCode: APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load timeline',
    });
    expect(timeline).toEqual([timelineEventResponse]);
  });

  it.each([
    ['../ai/health', '..%2Fai%2Fhealth'],
    ['abc?x=1', 'abc%3Fx%3D1'],
    ['abc#frag', 'abc%23frag'],
  ])('encodes %s so it cannot escape the job path', async (rawJobId, encodedJobId) => {
    await getTimelineEvents(rawJobId);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${encodedJobId}/timeline`, expect.anything());
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.TIMELINE_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getTimelineEvents(JOB_ID)).rejects.toBe(apiError);
  });

  describe('getAllTimelineEvents', () => {
    beforeEach(() => {
      vi.mocked(getJson).mockClear();
    });

    const eventWithId = (id: string): TTimelineEventResponse => ({ ...timelineEventResponse, id });

    /**
     * One page as the API returns it. `totalElements` is the total across
     * every page, as the backend reports it, not this page's row count.
     */
    const page = (
      number: number,
      ids: string[],
      totalPages: number,
      totalElements: number,
    ): TTimelineEventPageResponse => ({
      content: ids.map(eventWithId),
      page: number,
      size: 100,
      totalElements,
      totalPages,
    });

    type TPageAnswer = TTimelineEventPageResponse | Error;

    /**
     * Answers each page request from `answer`, given the page number and
     * which read of the history this is (a new read starts at page 0).
     */
    const servePages = (answer: (pageNumber: number, attempt: number) => TPageAnswer) => {
      let attempt = 0;

      vi.mocked(getJson).mockImplementation((url: string) => {
        const pageNumber = Number(new URL(url, 'http://localhost').searchParams.get('page'));

        if (pageNumber === 0) attempt += 1;

        const result = answer(pageNumber, attempt);

        return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
      });
    };

    const servePagesOnce = (pages: Record<number, TPageAnswer>) =>
      servePages((pageNumber) => pages[pageNumber] as TPageAnswer);

    it('reads every page at the largest size and returns every event', async () => {
      servePagesOnce({
        0: page(0, ['a', 'b'], 3, 4),
        1: page(1, ['c'], 3, 4),
        2: page(2, ['d'], 3, 4),
      });

      const events = await getAllTimelineEvents();

      expect(events.map((event) => event.id)).toEqual(['a', 'b', 'c', 'd']);
      expect(getJson).toHaveBeenCalledWith('/api/timeline-events?page=0&size=100', {
        errorCode: APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to load status history',
      });
      expect(getJson).toHaveBeenCalledTimes(3);
    });

    it('makes one request when there is no history', async () => {
      servePagesOnce({ 0: page(0, [], 0, 0) });

      expect(await getAllTimelineEvents()).toEqual([]);
      expect(getJson).toHaveBeenCalledTimes(1);
    });

    it('returns a row that appears on two pages once', async () => {
      servePagesOnce({ 0: page(0, ['a', 'b'], 2, 3), 1: page(1, ['b', 'c'], 2, 3) });

      expect((await getAllTimelineEvents()).map((event) => event.id)).toEqual(['a', 'b', 'c']);
    });

    it('rejects when any later page fails, rather than returning part of the history', async () => {
      const failure = new AppError('Failed', APP_ERROR_CODES.TIMELINE_REQUEST_FAILED);
      servePagesOnce({ 0: page(0, ['a'], 3, 3), 1: page(1, ['b'], 3, 3), 2: failure });

      await expect(getAllTimelineEvents()).rejects.toBe(failure);
    });

    it('reads again when a job deleted mid-read moves rows onto a page already read', async () => {
      // Read 1: page 0 holds a, b of a, b, c, d. Then a's job is deleted, so
      // page 1 now starts at d: c moved back onto page 0 and was never seen.
      servePages((pageNumber, attempt) => {
        if (attempt === 1)
          return pageNumber === 0 ? page(0, ['a', 'b'], 2, 4) : page(1, ['d'], 2, 3);

        return pageNumber === 0 ? page(0, ['b', 'c'], 2, 3) : page(1, ['d'], 2, 3);
      });

      expect((await getAllTimelineEvents()).map((event) => event.id)).toEqual(['b', 'c', 'd']);
      expect(getJson).toHaveBeenCalledTimes(4);
    });

    it('reads again when the history grows onto a page that was not requested', async () => {
      servePages((pageNumber, attempt) => {
        if (attempt === 1)
          return pageNumber === 0 ? page(0, ['a', 'b'], 2, 3) : page(1, ['c', 'd'], 3, 5);

        return pageNumber === 0
          ? page(0, ['a', 'b'], 3, 5)
          : page(pageNumber, pageNumber === 1 ? ['c', 'd'] : ['e'], 3, 5);
      });

      expect((await getAllTimelineEvents()).map((event) => event.id)).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
    });

    it('fails instead of returning part of the history when every read disagrees', async () => {
      servePages((pageNumber) =>
        pageNumber === 0 ? page(0, ['a', 'b'], 2, 4) : page(1, ['d'], 2, 3),
      );

      await expect(getAllTimelineEvents()).rejects.toMatchObject({
        code: APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
        message: 'Failed to load status history',
      });
      expect(getJson).toHaveBeenCalledTimes(4);
    });
  });
});
