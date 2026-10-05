import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createResumeProfile,
  deleteResumeProfile,
  getResumeProfiles,
  updateResumeProfile,
} from './profiles.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { createEmptyProfileContent } from '../../features/profile/profileEntries.utils';
import { APP_ERROR_CODES } from '../../types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const body = { name: 'Base', profile: createEmptyProfileContent() };

describe('profiles.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([]);
    vi.mocked(postJson).mockResolvedValue({});
    vi.mocked(putJson).mockResolvedValue({});
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it('reads, creates, replaces, and deletes at /api/resume-profiles', async () => {
    await getResumeProfiles();
    await createResumeProfile(body);
    await updateResumeProfile('p 1', body);
    await deleteResumeProfile('p 1');

    expect(getJson).toHaveBeenCalledWith('/api/resume-profiles', {
      errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load resume profiles',
    });
    expect(postJson).toHaveBeenCalledWith('/api/resume-profiles', body, {
      errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to create resume profile',
    });
    expect(putJson).toHaveBeenCalledWith('/api/resume-profiles/p%201', body, {
      errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to save resume profile',
    });
    expect(deleteJson).toHaveBeenCalledWith('/api/resume-profiles/p%201', {
      errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete resume profile',
    });
  });
});
