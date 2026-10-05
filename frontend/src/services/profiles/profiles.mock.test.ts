import { beforeEach, describe, expect, it } from 'vitest';

import {
  USE_MOCK_PROFILES,
  mockCreateResumeProfile,
  mockDeleteResumeProfile,
  mockGetResumeProfiles,
  mockUpdateResumeProfile,
  resetMockProfiles,
} from './profiles.mock';
import { createEmptyProfileContent } from '../../features/profile/profileEntries.utils';

/*
 * TEMPORARY: covers profiles.mock.ts, and goes with it when the task 044
 * backend lands.
 */

const body = { name: 'Backend profile', profile: createEmptyProfileContent() };

describe('profiles.mock', () => {
  beforeEach(() => {
    resetMockProfiles();
  });

  it('is off outside the dev server, including under Vitest', () => {
    expect(USE_MOCK_PROFILES).toBe(false);
  });

  it('seeds one base profile whose entries already have ids', async () => {
    const [seeded] = await mockGetResumeProfiles();

    expect(seeded?.name).toBe('Base profile');
    expect(seeded?.profile.highlights.every((entry) => entry.id)).toBe(true);
  });

  it('creates, updates, and deletes a profile without sharing its store', async () => {
    const created = await mockCreateResumeProfile(body);

    created.name = 'changed outside';

    expect((await mockGetResumeProfiles()).map((profile) => profile.name)).toContain(
      'Backend profile',
    );

    const updated = await mockUpdateResumeProfile(created.id, { ...body, name: 'Renamed' });

    expect(updated.name).toBe('Renamed');

    await mockDeleteResumeProfile(created.id);

    expect((await mockGetResumeProfiles()).map((profile) => profile.id)).not.toContain(created.id);
  });

  it('rejects an unknown profile like the API would', async () => {
    await expect(mockUpdateResumeProfile('missing', body)).rejects.toMatchObject({ status: 404 });
    await expect(mockDeleteResumeProfile('missing')).rejects.toMatchObject({
      apiCode: 'PROFILE_NOT_FOUND',
    });
  });
});
