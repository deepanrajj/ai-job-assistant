import { describe, expect, it } from 'vitest';

import { mapTimelineEventResponseToJobTimelineEvent } from './timeline.utils';
import type { TTimelineEventResponse } from './timeline.types';

describe('timeline.utils', () => {
  describe('mapTimelineEventResponseToJobTimelineEvent', () => {
    it('maps a status-change response and drops previousStatus/nextStatus', () => {
      const response: TTimelineEventResponse = {
        id: 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d',
        type: 'STATUS_CHANGE',
        description: 'Status changed from APPLIED to INTERVIEW.',
        previousStatus: 'APPLIED',
        nextStatus: 'INTERVIEW',
        createdAt: '2026-09-10T18:50:40.881640926Z',
      };

      expect(mapTimelineEventResponseToJobTimelineEvent(response)).toEqual({
        id: 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d',
        title: 'Status change',
        description: 'Status changed from APPLIED to INTERVIEW.',
        createdAt: '2026-09-10T18:50:40.881640926Z',
      });
    });
  });
});
