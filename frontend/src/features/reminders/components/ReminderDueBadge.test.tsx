import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { ReminderDueBadge } from './ReminderDueBadge';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('ReminderDueBadge', () => {
  it('says when an overdue reminder was due, in the danger colour', () => {
    renderWithProviders(<ReminderDueBadge dueDate="2026-05-10" dueState="overdue" />);

    expect(screen.getByText('Overdue · was due May 10, 2026')).toHaveClass('bg-danger-50');
  });

  it('says a reminder is due today, in the warning colour', () => {
    renderWithProviders(<ReminderDueBadge dueDate="2026-05-10" dueState="today" />);

    expect(screen.getByText('Due today')).toHaveClass('bg-warning-50');
  });

  it('shows the date of an upcoming reminder, in the neutral colour', () => {
    renderWithProviders(<ReminderDueBadge dueDate="2026-05-10" dueState="upcoming" />);

    expect(screen.getByText('Due May 10, 2026')).toHaveClass('bg-slate-100');
  });

  it('shows a date it cannot parse as written instead of failing to render', () => {
    renderWithProviders(<ReminderDueBadge dueDate="not-a-date" dueState="upcoming" />);

    expect(screen.getByText('Due not-a-date')).toBeInTheDocument();
  });
});
