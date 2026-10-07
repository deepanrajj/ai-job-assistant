import { describe, expect, it, vi } from 'vitest';

import { getProfilePreferences, saveProfilePreferences } from './preferences.service';
import { getJson, putJson } from '../api';
import { createEmptyProfilePreferences } from './preferences.utils';
import { APP_ERROR_CODES } from '../../types';

vi.mock('../api', () => ({
  getJson: vi.fn(),
  putJson: vi.fn(),
}));

describe('preferences.service', () => {
  it('reads and replaces the record at /api/profile/preferences', async () => {
    vi.mocked(getJson).mockResolvedValue({ skills: null });
    vi.mocked(putJson).mockResolvedValue({});
    const preferences = createEmptyProfilePreferences();

    await expect(getProfilePreferences()).resolves.toEqual({ ...preferences, updatedAt: null });
    await expect(saveProfilePreferences(preferences)).resolves.toEqual({
      ...preferences,
      updatedAt: null,
    });

    expect(getJson).toHaveBeenCalledWith('/api/profile/preferences', {
      errorCode: APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load skills and preferences',
    });
    expect(putJson).toHaveBeenCalledWith('/api/profile/preferences', preferences, {
      errorCode: APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to save skills and preferences',
    });
  });
});
