import { describe, expect, it } from 'vitest';

import { getApplicationHistory, getMissingApplicationReason } from './statusHistory.utils';
import { createMockJob } from '../../test/mockJobs';
import { createMockTimelineEventResponse } from '../../test/mockTimeline';

describe('getApplicationHistory', () => {
  it('records first applications and wishlist withdrawals together', () => {
    const applied = createMockJob({ id: 'applied', status: 'APPLIED' });
    const dropped = createMockJob({ id: 'dropped', status: 'WITHDRAWN' });
    const history = getApplicationHistory(
      [applied, dropped],
      [
        createMockTimelineEventResponse({
          createdAt: '2026-05-02T09:00:00.000Z',
          id: 'e1',
          jobId: 'applied',
          nextStatus: 'APPLIED',
          previousStatus: 'WISHLIST',
        }),
        createMockTimelineEventResponse({
          createdAt: '2026-05-03T09:00:00.000Z',
          id: 'e2',
          jobId: 'dropped',
          nextStatus: 'WITHDRAWN',
          previousStatus: 'WISHLIST',
        }),
      ],
    );

    expect(history.applications.get('applied')?.appliedAt).toEqual(
      new Date('2026-05-02T09:00:00.000Z'),
    );
    expect([...history.withdrawnFromWishlist]).toEqual(['dropped']);
  });
});

describe('getMissingApplicationReason', () => {
  const history = { applications: new Map(), withdrawnFromWishlist: new Set(['dropped']) };

  it('names a never-applied job, a missing record, and an unavailable history', () => {
    expect(getMissingApplicationReason(createMockJob({ status: 'WISHLIST' }), history)).toBe(
      'notApplied',
    );
    expect(
      getMissingApplicationReason(createMockJob({ id: 'dropped', status: 'WITHDRAWN' }), history),
    ).toBe('notApplied');
    expect(getMissingApplicationReason(createMockJob({ status: 'APPLIED' }), history)).toBe(
      'notRecorded',
    );
    expect(getMissingApplicationReason(createMockJob({ status: 'APPLIED' }), null)).toBe(
      'unavailable',
    );
  });
});
