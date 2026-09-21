import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTask, deleteTask, getTasks, updateTask } from './tasks.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TTaskResponse } from './tasks.types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';
const TASK_ID = 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d';

/**
 * A task exactly as the backend sends it.
 */
const taskResponse: TTaskResponse = {
  id: TASK_ID,
  title: 'Prepare portfolio',
  status: 'TODO',
  dueDate: null,
  createdAt: '2026-09-10T18:50:40.881640926Z',
  updatedAt: '2026-09-10T18:50:40.881640926Z',
};

describe('tasks.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([taskResponse]);
    vi.mocked(postJson).mockResolvedValue(taskResponse);
    vi.mocked(putJson).mockResolvedValue(taskResponse);
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it("requests a job's tasks with the list error mapping", async () => {
    const tasks = await getTasks(JOB_ID);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/tasks`, {
      errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load tasks',
    });
    expect(tasks).toEqual([taskResponse]);
  });

  it('posts only the fields the backend accepts when creating a task', async () => {
    const task = await createTask(JOB_ID, { title: 'Prepare portfolio' });

    expect(postJson).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}/tasks`,
      { title: 'Prepare portfolio' },
      {
        errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to create task',
      },
    );
    expect(task).toEqual(taskResponse);
  });

  it('sends an explicit null rather than an omission when an update clears the due date', async () => {
    const task = await updateTask(JOB_ID, TASK_ID, {
      title: 'Prepare portfolio and references',
      status: 'DONE',
      dueDate: null,
    });

    expect(putJson).toHaveBeenCalledWith(
      `/api/jobs/${JOB_ID}/tasks/${TASK_ID}`,
      {
        title: 'Prepare portfolio and references',
        status: 'DONE',
        dueDate: null,
      },
      {
        errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
        fallbackErrorMessage: 'Failed to update task',
      },
    );
    expect(task).toEqual(taskResponse);
  });

  it('returns the delete result unchanged', async () => {
    const result = await deleteTask(JOB_ID, TASK_ID);

    expect(deleteJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/tasks/${TASK_ID}`, {
      errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete task',
    });
    expect(result).toBeUndefined();
  });

  it.each([
    ['../ai/health', '..%2Fai%2Fhealth'],
    ['abc?x=1', 'abc%3Fx%3D1'],
    ['abc#frag', 'abc%23frag'],
  ])('encodes %s so it cannot escape the job path', async (rawJobId, encodedJobId) => {
    await getTasks(rawJobId);

    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${encodedJobId}/tasks`, expect.anything());
  });

  it('encodes both the job id and the task id on a task route', async () => {
    await updateTask('../ai/health', '../other-job/tasks/x', {
      title: 'Prepare portfolio',
      status: 'TODO',
      dueDate: null,
    });
    await deleteTask('../ai/health', '../other-job/tasks/x');

    const expectedUrl = '/api/jobs/..%2Fai%2Fhealth/tasks/..%2Fother-job%2Ftasks%2Fx';

    expect(putJson).toHaveBeenCalledWith(expectedUrl, expect.anything(), expect.anything());
    expect(deleteJson).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.TASK_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getTasks(JOB_ID)).rejects.toBe(apiError);
  });
});
