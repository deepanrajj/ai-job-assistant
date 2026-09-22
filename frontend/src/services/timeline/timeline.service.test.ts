import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTimelineEvents } from './timeline.service';
import { getJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TTimelineEventResponse } from './timeline.types';

vi.mock('../api', () => ({
  getJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';

/**
 * A timeline event exactly as the backend sends it.
 */
const timelineEventResponse: TTimelineEventResponse = {
  id: 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d',
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
});
