import { describe, expect, it, vi } from 'vitest';

import { getCalendarItems } from './calendar.service';
import { getJson } from '../api';
import { APP_ERROR_CODES } from '../../types';

vi.mock('../api', () => ({
  getJson: vi.fn(),
}));

describe('calendar.service', () => {
  it('requests the items in an inclusive date range', async () => {
    vi.mocked(getJson).mockResolvedValue([]);

    expect(await getCalendarItems('2026-10-01', '2026-10-31')).toEqual([]);
    expect(getJson).toHaveBeenCalledWith('/api/calendar-items?from=2026-10-01&to=2026-10-31', {
      errorCode: APP_ERROR_CODES.CALENDAR_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load the calendar',
    });
  });
});
