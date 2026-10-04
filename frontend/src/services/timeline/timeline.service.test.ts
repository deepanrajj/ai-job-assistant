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

    const page = (
      number: number,
      ids: string[],
      totalPages: number,
    ): TTimelineEventPageResponse => ({
      content: ids.map(eventWithId),
      page: number,
      size: 100,
      totalElements: ids.length,
      totalPages,
    });

    /**
     * Answers each page request from `pages`, by the `page` query value.
     */
    const servePages = (pages: Record<number, TTimelineEventPageResponse | Error>) => {
      vi.mocked(getJson).mockImplementation((url: string) => {
        const pageNumber = Number(new URL(url, 'http://localhost').searchParams.get('page'));
        const answer = pages[pageNumber];

        return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
      });
    };

    it('reads every page at the largest size and returns every event', async () => {
      servePages({
        0: page(0, ['a', 'b'], 3),
        1: page(1, ['c'], 3),
        2: page(2, ['d'], 3),
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
      servePages({ 0: page(0, [], 0) });

      expect(await getAllTimelineEvents()).toEqual([]);
      expect(getJson).toHaveBeenCalledTimes(1);
    });

    it('returns an event that shifted onto the next page once', async () => {
      servePages({ 0: page(0, ['a', 'b'], 2), 1: page(1, ['b', 'c'], 2) });

      expect((await getAllTimelineEvents()).map((event) => event.id)).toEqual(['a', 'b', 'c']);
    });

    it('rejects when any later page fails, rather than returning part of the history', async () => {
      const failure = new AppError('Failed', APP_ERROR_CODES.TIMELINE_REQUEST_FAILED);
      servePages({ 0: page(0, ['a'], 3), 1: page(1, ['b'], 3), 2: failure });

      await expect(getAllTimelineEvents()).rejects.toBe(failure);
    });
  });
});
