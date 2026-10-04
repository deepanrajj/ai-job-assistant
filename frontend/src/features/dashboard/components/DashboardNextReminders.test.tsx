import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DashboardNextReminders } from './DashboardNextReminders';
import { AppError } from '../../../errors';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobs } from '../../../test/mockJobs';
import { localDateFromToday } from '../../../test/mockReminders';
import { APP_ERROR_CODES, type TReminderItem } from '../../../types';

const overdueReminder: TReminderItem = {
  dueDate: localDateFromToday(-1),
  id: 'reminder-1',
  isComplete: false,
  jobId: MOCK_JOB_IDS.celonis,
  source: 'REMINDER',
  title: 'Follow up with recruiter',
  type: 'FOLLOW_UP',
};

const taskReminder: TReminderItem = {
  dueDate: localDateFromToday(0),
  id: 'task-1',
  isComplete: false,
  jobId: MOCK_JOB_IDS.personio,
  source: 'TASK',
  title: 'Tailor CV bullets',
  type: null,
};

const renderCard = (overrides: Partial<ComponentProps<typeof DashboardNextReminders>> = {}) =>
  renderWithRouter(
    <DashboardNextReminders
      error={null}
      isLoading={false}
      jobs={createMockJobs()}
      onRetry={() => {}}
      reminders={[overdueReminder, taskReminder]}
      {...overrides}
    />,
  );

describe('DashboardNextReminders', () => {
  it('renders each reminder with its job, kind, and due state, linking to the job', () => {
    renderCard();

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleName('Open Celonis for reminder Follow up with recruiter');
    expect(links[0]).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);
    expect(
      within(links[0]).getByText(/Follow-up · Celonis - Senior Frontend Engineer/),
    ).toBeInTheDocument();
    expect(within(links[0]).getByText(/^Overdue · was due/)).toBeInTheDocument();
    expect(within(links[1]).getByText(/^Task · Personio/)).toBeInTheDocument();
    expect(within(links[1]).getByText('Due today')).toBeInTheDocument();
  });

  it('names a reminder whose job is not in the loaded list as an unknown job', () => {
    renderCard({ reminders: [{ ...overdueReminder, jobId: 'missing-job' }] });

    expect(screen.getByRole('link')).toHaveAccessibleName(
      'Open Unknown job for reminder Follow up with recruiter',
    );
    expect(screen.getByText(/Follow-up · Unknown job/)).toBeInTheDocument();
  });

  it('renders an empty state when nothing is due', () => {
    renderCard({ reminders: [] });

    expect(screen.getByText('Nothing due')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a loading state inside the card', () => {
    renderCard({ isLoading: true });

    expect(screen.getByRole('heading', { name: 'Next reminders' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading reminders');
  });

  it('renders a retryable error inside the card', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderCard({
      error: new AppError(
        'Failed to load upcoming reminders',
        APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
      ),
      onRetry,
    });

    expect(screen.getByText('Reminders could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
