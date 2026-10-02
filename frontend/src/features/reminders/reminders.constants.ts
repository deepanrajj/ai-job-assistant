import type { TReminderDueState } from './reminders.types';

/**
 * Badge colours per due state, reusing the status pill palette: danger for
 * overdue, warning for today, and the neutral slate for later.
 */
export const reminderDueBadgeClasses: Record<TReminderDueState, string> = {
  overdue: 'bg-danger-50 text-danger-700 ring-danger-100',
  today: 'bg-warning-50 text-warning-800 ring-warning-100',
  upcoming: 'bg-slate-100 text-slate-700 ring-slate-200',
};

/**
 * Number of reminders the dashboard asks for.
 */
export const NEXT_REMINDERS_LIMIT = 5;
