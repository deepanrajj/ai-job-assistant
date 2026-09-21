import { describe, expect, it } from 'vitest';

import { mapTaskResponseToJobTask } from './tasks.utils';
import type { TTaskResponse } from './tasks.types';

const populatedResponse: TTaskResponse = {
  id: 'task-001',
  title: 'Tailor CV bullets',
  status: 'DONE',
  dueDate: '2026-05-10',
  createdAt: '2026-05-01T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
};

describe('mapTaskResponseToJobTask', () => {
  it('maps every field through unchanged', () => {
    expect(mapTaskResponseToJobTask(populatedResponse)).toEqual({
      id: 'task-001',
      title: 'Tailor CV bullets',
      status: 'DONE',
      dueDate: '2026-05-10',
    });
  });

  it('maps a null due date to an empty string', () => {
    expect(mapTaskResponseToJobTask({ ...populatedResponse, dueDate: null })).toMatchObject({
      dueDate: '',
    });
  });
});
