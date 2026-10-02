import { describe, expect, it } from 'vitest';

import {
  buildCreateReminderRequest,
  buildUpdateReminderRequest,
  isReminderFormValid,
  mapNextReminderResponseToReminderItem,
  mapReminderResponseToReminderItem,
  mapTaskResponseToReminderItem,
} from './reminders.utils';
import {
  createMockNextReminderResponse,
  createMockReminderResponse,
} from '../../test/mockReminders';
import { createMockTaskResponse } from '../../test/mockTasks';

const JOB_ID = 'job-001';

describe('mapReminderResponseToReminderItem', () => {
  it('maps an open stored reminder, taking the job id from the caller', () => {
    expect(mapReminderResponseToReminderItem(createMockReminderResponse(), JOB_ID)).toEqual({
      id: 'c3333333-3333-4333-8333-333333333333',
      jobId: JOB_ID,
      source: 'REMINDER',
      type: 'FOLLOW_UP',
      title: 'Follow up with recruiter',
      dueDate: '2026-05-12',
      isComplete: false,
    });
  });

  it('treats a set completedAt as complete', () => {
    const item = mapReminderResponseToReminderItem(
      createMockReminderResponse({ completedAt: '2026-05-12T10:00:00Z' }),
      JOB_ID,
    );

    expect(item.isComplete).toBe(true);
  });
});

describe('mapTaskResponseToReminderItem', () => {
  it('maps a dated task to a typeless task reminder', () => {
    expect(mapTaskResponseToReminderItem(createMockTaskResponse(), JOB_ID)).toEqual({
      id: 'a1111111-1111-4111-8111-111111111111',
      jobId: JOB_ID,
      source: 'TASK',
      type: null,
      title: 'Tailor CV bullets',
      dueDate: '2026-05-10',
      isComplete: false,
    });
  });

  it('treats a DONE task as complete', () => {
    const item = mapTaskResponseToReminderItem(createMockTaskResponse({ status: 'DONE' }), JOB_ID);

    expect(item?.isComplete).toBe(true);
  });

  it('returns null for a task without a due date', () => {
    expect(mapTaskResponseToReminderItem(createMockTaskResponse({ dueDate: null }), JOB_ID)).toBe(
      null,
    );
  });
});

describe('mapNextReminderResponseToReminderItem', () => {
  it('keeps the source, job id, and null type of a task item, and marks it open', () => {
    expect(
      mapNextReminderResponseToReminderItem(
        createMockNextReminderResponse({ source: 'TASK', type: null, jobId: JOB_ID }),
      ),
    ).toEqual({
      id: 'c3333333-3333-4333-8333-333333333333',
      jobId: JOB_ID,
      source: 'TASK',
      type: null,
      title: 'Follow up with recruiter',
      dueDate: '2026-05-12',
      isComplete: false,
    });
  });
});

describe('isReminderFormValid', () => {
  it('accepts a title and a due date', () => {
    expect(isReminderFormValid({ dueDate: '2026-10-05', title: 'Call', type: 'OTHER' })).toBe(true);
  });

  it('rejects a blank title', () => {
    expect(isReminderFormValid({ dueDate: '2026-10-05', title: '   ', type: 'OTHER' })).toBe(false);
  });

  it('rejects a missing due date', () => {
    expect(isReminderFormValid({ dueDate: '', title: 'Call', type: 'OTHER' })).toBe(false);
  });
});

describe('reminder request builders', () => {
  const values = {
    dueDate: '2026-10-05',
    title: '  Prepare system design  ',
    type: 'INTERVIEW_PREP' as const,
  };

  it('trims the title for a create request', () => {
    expect(buildCreateReminderRequest(values)).toEqual({
      dueDate: '2026-10-05',
      title: 'Prepare system design',
      type: 'INTERVIEW_PREP',
    });
  });

  it('adds the completion flag for an update request', () => {
    expect(buildUpdateReminderRequest(values, true)).toEqual({
      completed: true,
      dueDate: '2026-10-05',
      title: 'Prepare system design',
      type: 'INTERVIEW_PREP',
    });
  });
});
