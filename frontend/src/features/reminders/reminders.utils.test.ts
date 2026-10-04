import { describe, expect, it } from 'vitest';

import { getLocalIsoDate, getReminderDueState, sortReminderItems } from './reminders.utils';
import type { TReminderItem } from '../../types';

const TODAY = '2026-10-02';

const createItem = (overrides: Partial<TReminderItem> = {}): TReminderItem => ({
  id: 'reminder-1',
  jobId: 'job-1',
  source: 'REMINDER',
  type: 'FOLLOW_UP',
  title: 'Follow up',
  dueDate: TODAY,
  isComplete: false,
  ...overrides,
});

describe('getLocalIsoDate', () => {
  it('formats the local calendar date with padded month and day', () => {
    expect(getLocalIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('uses the local date, not the UTC one, late in the evening', () => {
    const lateEvening = new Date(2026, 9, 2, 23, 59);

    expect(getLocalIsoDate(lateEvening)).toBe('2026-10-02');
  });

  it('pads a year below 1000 to four digits', () => {
    const date = new Date(2026, 0, 1);

    date.setFullYear(999);

    expect(getLocalIsoDate(date)).toBe('0999-01-01');
  });
});

describe('getReminderDueState', () => {
  it('marks an open reminder before today as overdue', () => {
    expect(getReminderDueState(createItem({ dueDate: '2026-10-01' }), TODAY)).toBe('overdue');
  });

  it('marks an open reminder due today as today', () => {
    expect(getReminderDueState(createItem({ dueDate: TODAY }), TODAY)).toBe('today');
  });

  it('marks an open reminder after today as upcoming', () => {
    expect(getReminderDueState(createItem({ dueDate: '2026-10-03' }), TODAY)).toBe('upcoming');
  });

  it('compares across a year boundary as dates', () => {
    expect(getReminderDueState(createItem({ dueDate: '2025-12-31' }), '2026-01-01')).toBe(
      'overdue',
    );
  });

  it('gives a completed reminder no due state, even when its date has passed', () => {
    expect(
      getReminderDueState(createItem({ dueDate: '2026-09-01', isComplete: true }), TODAY),
    ).toBeNull();
  });
});

describe('sortReminderItems', () => {
  it('orders by due date, then by id, without mutating the input', () => {
    const later = createItem({ id: 'a', dueDate: '2026-10-09' });
    const sameDayB = createItem({ id: 'b', dueDate: '2026-10-03', source: 'TASK', type: null });
    const sameDayA = createItem({ id: 'a', dueDate: '2026-10-03' });
    const input = [later, sameDayB, sameDayA];

    expect(sortReminderItems(input)).toEqual([sameDayA, sameDayB, later]);
    expect(input).toEqual([later, sameDayB, sameDayA]);
  });

  it('keeps items with the same date and id in place', () => {
    const task = createItem({ id: 'same', source: 'TASK', type: null });
    const reminder = createItem({ id: 'same' });

    expect(sortReminderItems([task, reminder])).toEqual([task, reminder]);
  });
});
