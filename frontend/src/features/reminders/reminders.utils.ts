import type { TReminderItem } from '../../types';
import type { TReminderDueState } from './reminders.types';

/**
 * Formats a date as the user's own calendar date, `YYYY-MM-DD`.
 *
 * Reads the local year, month, and day rather than `toISOString()`, which
 * reports the UTC date: a user in Berlin shortly after midnight would
 * otherwise still be on yesterday. Due states depend on the user's today,
 * not the server's, which is why they are computed here at all.
 *
 * @param {Date} date Moment to read the local calendar date from.
 * @returns {string} Local calendar date in `YYYY-MM-DD` form.
 */
export const getLocalIsoDate = (date: Date): string => {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Works out whether an open reminder is overdue, due today, or upcoming.
 *
 * Both values are `YYYY-MM-DD` with a four-digit year, so comparing them
 * as strings compares them as dates, with no parsing that a malformed
 * stored value could make throw.
 *
 * @param {TReminderItem} item Reminder to classify.
 * @param {string} today Today's local calendar date, from `getLocalIsoDate`.
 * @returns {TReminderDueState | null} Due state, or null for a completed reminder.
 */
export const getReminderDueState = (
  item: TReminderItem,
  today: string,
): TReminderDueState | null => {
  if (item.isComplete) return null;
  if (item.dueDate < today) return 'overdue';

  return item.dueDate === today ? 'today' : 'upcoming';
};

/**
 * Orders reminders by due date, earliest first, then by id so the order is
 * total and stable across reloads.
 *
 * @param {TReminderItem[]} items Reminders in any order.
 * @returns {TReminderItem[]} A new, sorted array.
 */
export const sortReminderItems = (items: TReminderItem[]): TReminderItem[] =>
  [...items].sort((left, right) => {
    if (left.dueDate !== right.dueDate) return left.dueDate < right.dueDate ? -1 : 1;
    if (left.id === right.id) return 0;

    return left.id < right.id ? -1 : 1;
  });
