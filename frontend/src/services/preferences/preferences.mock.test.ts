import { beforeEach, describe, expect, it } from 'vitest';

import {
  USE_MOCK_PREFERENCES,
  mockGetProfilePreferences,
  mockSaveProfilePreferences,
  resetMockProfilePreferences,
} from './preferences.mock';
import { createEmptyProfilePreferences } from './preferences.utils';

/*
 * TEMPORARY: covers preferences.mock.ts, and goes with it when the task
 * 045 backend lands.
 */

describe('preferences.mock', () => {
  beforeEach(() => {
    resetMockProfilePreferences();
  });

  it('is off outside the dev server, including under Vitest', () => {
    expect(USE_MOCK_PREFERENCES).toBe(false);
  });

  it('seeds an unsaved record, then returns what was saved', async () => {
    expect((await mockGetProfilePreferences()).updatedAt).toBeNull();

    const saved = await mockSaveProfilePreferences({
      ...createEmptyProfilePreferences(),
      skills: ['Go'],
    });

    expect(saved.updatedAt).not.toBeNull();
    expect((await mockGetProfilePreferences()).skills).toEqual(['Go']);
  });
});
