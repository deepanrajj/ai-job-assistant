import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createReminder,
  deleteReminder,
  getNextReminders,
  getReminders,
  updateReminder,
} from './reminders.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TReminderResponse } from './reminders.types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';
const REMINDER_ID = 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d';

/**
 * A reminder exactly as the backend sends it.
 */
const reminderResponse: TReminderResponse = {
  id: REMINDER_ID,
  type: 'FOLLOW_UP',
  title: 'Follow up with recruiter',
  dueDate: '2026-10-05',
  completedAt: null,
  createdAt: '2026-09-10T18:50:40.881640926Z',
  updatedAt: '2026-09-10T18:50:40.881640926Z',
};

const createRequest = {
  type: 'FOLLOW_UP' as const,
  title: 'Follow up with recruiter',
  dueDate: '2026-10-05',
};

describe('reminders.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([reminderResponse]);
    vi.mocked(postJson).mockResolvedValue(reminderResponse);
    vi.mocked(putJson).mockResolvedValue(reminderResponse);
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it("requests a job's reminders with the list error mapping", async () => {
    const reminders = await getReminders(JOB_ID);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/reminders`, {
      errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load reminders',
    });
    expect(reminders).toEqual([reminderResponse]);
  });

  it('posts type, title, and due date when creating a reminder', async () => {
    const reminder = await createReminder(JOB_ID, createRequest);

    expect(postJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/reminders`, createRequest, {
      errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to create reminder',
    });
    expect(reminder).toEqual(reminderResponse);
  });

  it('replaces every field, including completion, when updating a reminder', async () => {
    const payload = { ...createRequest, completed: true };
    const reminder = await updateReminder(JOB_ID, REMINDER_ID, payload);

    expect(putJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/reminders/${REMINDER_ID}`, payload, {
      errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to update reminder',
    });
    expect(reminder).toEqual(reminderResponse);
  });

  it('returns the delete result unchanged', async () => {
    const result = await deleteReminder(JOB_ID, REMINDER_ID);

    expect(deleteJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/reminders/${REMINDER_ID}`, {
      errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete reminder',
    });
    expect(result).toBeUndefined();
  });

  it('requests the next reminders across jobs with the given limit', async () => {
    await getNextReminders(5);

    expect(getJson).toHaveBeenCalledWith('/api/reminders/next?limit=5', {
      errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load upcoming reminders',
    });
  });

  it('encodes both the job id and the reminder id on a reminder route', async () => {
    await updateReminder('../ai/health', '../other-job/reminders/x', {
      ...createRequest,
      completed: false,
    });
    await deleteReminder('../ai/health', '../other-job/reminders/x');

    const expectedUrl = '/api/jobs/..%2Fai%2Fhealth/reminders/..%2Fother-job%2Freminders%2Fx';
    expect(putJson).toHaveBeenCalledWith(expectedUrl, expect.anything(), expect.anything());
    expect(deleteJson).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.REMINDER_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getReminders(JOB_ID)).rejects.toBe(apiError);
  });
});
