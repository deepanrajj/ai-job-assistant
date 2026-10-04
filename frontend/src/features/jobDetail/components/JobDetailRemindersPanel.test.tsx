import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailRemindersPanel } from './JobDetailRemindersPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { MOCK_JOB_IDS } from '../../../test/mockJobs';
import {
  MOCK_REMINDER_IDS,
  createMockReminderResponse,
  localDateFromToday,
} from '../../../test/mockReminders';
import { MOCK_TASK_IDS, createMockTaskResponse } from '../../../test/mockTasks';
import { server } from '../../../test/server';
import type { TReminderResponse, TTaskResponse } from '../../../services';

const JOB_ID = MOCK_JOB_IDS.celonis;
const remindersEndpoint = `/api/jobs/${JOB_ID}/reminders`;
const reminderEndpoint = `${remindersEndpoint}/${MOCK_REMINDER_IDS.primary}`;
const tasksEndpoint = `/api/jobs/${JOB_ID}/tasks`;

const serveSources = (reminders: TReminderResponse[], tasks: TTaskResponse[] = []) => {
  server.use(
    http.get(remindersEndpoint, () => HttpResponse.json(reminders)),
    http.get(tasksEndpoint, () => HttpResponse.json(tasks)),
  );
};

const renderPanel = () => renderWithProviders(<JobDetailRemindersPanel jobId={JOB_ID} />);

const getRow = (title: string): HTMLElement => screen.getByText(title).closest('li') as HTMLElement;

/**
 * The add form is the only one holding the "Add reminder" button; scoping
 * to it keeps field queries unambiguous once a row is open for editing.
 */
const getAddForm = async (): Promise<HTMLElement> =>
  (await screen.findByRole('button', { name: 'Add reminder' })).closest('form') as HTMLElement;

describe('JobDetailRemindersPanel', () => {
  it('renders overdue, due today, and upcoming reminders with their due state', async () => {
    serveSources([
      createMockReminderResponse({
        dueDate: localDateFromToday(-2),
        id: 'r-overdue',
        title: 'Overdue follow-up',
      }),
      createMockReminderResponse({
        dueDate: localDateFromToday(0),
        id: 'r-today',
        title: 'Deadline today',
        type: 'APPLICATION_DEADLINE',
      }),
      createMockReminderResponse({
        dueDate: '2999-05-10',
        id: 'r-upcoming',
        title: 'Prepare interview',
        type: 'INTERVIEW_PREP',
      }),
    ]);
    renderPanel();

    expect(await screen.findByText('Overdue follow-up')).toBeInTheDocument();
    expect(within(getRow('Overdue follow-up')).getByText(/^Overdue · was due/)).toBeInTheDocument();
    expect(within(getRow('Deadline today')).getByText('Due today')).toBeInTheDocument();
    expect(within(getRow('Deadline today')).getByText('Application deadline')).toBeInTheDocument();
    expect(within(getRow('Prepare interview')).getByText('Due May 10, 2999')).toBeInTheDocument();

    const openList = screen.getByRole('list', { name: 'Open reminders' });
    expect(
      within(openList)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining('Overdue follow-up'),
      expect.stringContaining('Deadline today'),
      expect.stringContaining('Prepare interview'),
    ]);
  });

  it('shows completed reminders in their own muted group with no due state', async () => {
    serveSources(
      [createMockReminderResponse({ completedAt: '2026-05-12T10:00:00Z', title: 'Sent CV' })],
      [createMockTaskResponse({ dueDate: localDateFromToday(-1), status: 'DONE' })],
    );
    renderPanel();

    const completedList = await screen.findByRole('list', { name: 'Completed' });
    const sentCv = within(completedList).getByText('Sent CV');

    expect(sentCv).toHaveClass('line-through');
    expect(within(completedList).getByText('Tailor CV bullets')).toHaveClass('line-through');
    expect(within(completedList).queryByText(/Overdue|Due/)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Complete Sent CV' })).toBeChecked();
  });

  it('lists a dated task as a task reminder without edit or delete, and skips undated tasks', async () => {
    serveSources(
      [],
      [
        createMockTaskResponse({ dueDate: '2999-01-01' }),
        createMockTaskResponse({ dueDate: null, id: MOCK_TASK_IDS.secondary, title: 'No date' }),
      ],
    );
    renderPanel();

    await screen.findByText('Tailor CV bullets');
    const row = getRow('Tailor CV bullets');

    expect(within(row).getByText('Task')).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.queryByText('No date')).not.toBeInTheDocument();
  });

  it('completes a task reminder by updating the task', async () => {
    const user = userEvent.setup();
    serveSources([], [createMockTaskResponse({ dueDate: '2999-01-01' })]);
    let body: unknown;
    server.use(
      http.put(`${tasksEndpoint}/${MOCK_TASK_IDS.primary}`, async ({ request }) => {
        body = await request.json();
        serveSources([], [createMockTaskResponse({ dueDate: '2999-01-01', status: 'DONE' })]);

        return HttpResponse.json(createMockTaskResponse({ dueDate: '2999-01-01', status: 'DONE' }));
      }),
    );
    renderPanel();

    await user.click(await screen.findByRole('checkbox', { name: 'Complete Tailor CV bullets' }));

    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Complete Tailor CV bullets' })).toBeChecked(),
    );
    expect(body).toEqual({ dueDate: '2999-01-01', status: 'DONE', title: 'Tailor CV bullets' });
    expect(
      within(screen.getByRole('list', { name: 'Completed' })).getByText('Tailor CV bullets'),
    ).toBeInTheDocument();
  });

  it('adds a reminder and clears the form', async () => {
    const user = userEvent.setup();
    serveSources([]);
    let body: unknown;
    server.use(
      http.post(remindersEndpoint, async ({ request }) => {
        body = await request.json();
        const created = createMockReminderResponse({
          dueDate: '2999-03-01',
          title: 'Ask for feedback',
          type: 'OTHER',
        });
        serveSources([created]);

        return HttpResponse.json(created, { status: 201 });
      }),
    );
    renderPanel();

    const form = await getAddForm();
    const addButton = within(form).getByRole('button', { name: 'Add reminder' });

    expect(addButton).toBeDisabled();

    await user.selectOptions(within(form).getByLabelText('Type'), 'OTHER');
    await user.type(within(form).getByLabelText('Title'), 'Ask for feedback');
    await user.type(within(form).getByLabelText('Due date'), '2999-03-01');
    await user.click(addButton);

    expect(await screen.findByText('Ask for feedback')).toBeInTheDocument();
    expect(body).toEqual({ dueDate: '2999-03-01', title: 'Ask for feedback', type: 'OTHER' });
    expect(within(form).getByLabelText('Title')).toHaveValue('');
  });

  it('edits a stored reminder in place', async () => {
    const user = userEvent.setup();
    serveSources([createMockReminderResponse({ dueDate: '2999-05-12' })]);
    let body: unknown;
    server.use(
      http.put(reminderEndpoint, async ({ request }) => {
        body = await request.json();
        const updated = createMockReminderResponse({
          dueDate: '2999-05-12',
          title: 'Call recruiter',
        });
        serveSources([updated]);

        return HttpResponse.json(updated);
      }),
    );
    renderPanel();

    await user.click(
      await screen.findByRole('button', { name: 'Edit reminder Follow up with recruiter' }),
    );
    const editRow = screen
      .getByRole('button', { name: 'Save reminder' })
      .closest('li') as HTMLElement;
    const titleInput = within(editRow).getByLabelText('Title');

    await user.clear(titleInput);
    await user.type(titleInput, 'Call recruiter');
    await user.click(within(editRow).getByRole('button', { name: 'Save reminder' }));

    expect(await screen.findByText('Call recruiter')).toBeInTheDocument();
    expect(body).toEqual({
      completed: false,
      dueDate: '2999-05-12',
      title: 'Call recruiter',
      type: 'FOLLOW_UP',
    });
    expect(screen.queryByRole('button', { name: 'Save reminder' })).not.toBeInTheDocument();
  });

  it('keeps the edit open with the typed values when saving fails, and cancels back', async () => {
    const user = userEvent.setup();
    serveSources([createMockReminderResponse({ dueDate: '2999-05-12' })]);
    server.use(http.put(reminderEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderPanel();

    await user.click(
      await screen.findByRole('button', { name: 'Edit reminder Follow up with recruiter' }),
    );
    const titleInput = screen.getAllByLabelText('Title')[1];

    await user.type(titleInput, ' now');
    await user.click(screen.getByRole('button', { name: 'Save reminder' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update reminder');
    expect(titleInput).toHaveValue('Follow up with recruiter now');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
  });

  it('deletes a stored reminder', async () => {
    const user = userEvent.setup();
    serveSources([createMockReminderResponse({ dueDate: '2999-05-12' })]);
    server.use(
      http.delete(reminderEndpoint, () => {
        serveSources([]);

        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPanel();

    await user.click(
      await screen.findByRole('button', { name: 'Delete reminder Follow up with recruiter' }),
    );

    expect(await screen.findByText('No reminders yet')).toBeInTheDocument();
  });

  it('shows a failed delete as an alert and keeps the reminder', async () => {
    const user = userEvent.setup();
    serveSources([createMockReminderResponse({ dueDate: '2999-05-12' })]);
    server.use(http.delete(reminderEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderPanel();

    await user.click(
      await screen.findByRole('button', { name: 'Delete reminder Follow up with recruiter' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to delete reminder');
    expect(screen.getByText('Follow up with recruiter')).toBeInTheDocument();
  });

  it('keeps the form values when creating fails', async () => {
    const user = userEvent.setup();
    serveSources([]);
    server.use(http.post(remindersEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderPanel();

    const form = await getAddForm();
    await user.type(within(form).getByLabelText('Title'), 'Ask for feedback');
    await user.type(within(form).getByLabelText('Due date'), '2999-03-01');
    await user.click(within(form).getByRole('button', { name: 'Add reminder' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to create reminder');
    expect(within(form).getByLabelText('Title')).toHaveValue('Ask for feedback');
  });

  it('shows a failed toggle as an alert', async () => {
    const user = userEvent.setup();
    serveSources([createMockReminderResponse({ dueDate: '2999-05-12' })]);
    server.use(http.put(reminderEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderPanel();

    await user.click(
      await screen.findByRole('checkbox', { name: 'Complete Follow up with recruiter' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update reminder');
  });

  it('renders the empty state when there is nothing to remind about', async () => {
    serveSources([], [createMockTaskResponse({ dueDate: null })]);
    renderPanel();

    expect(await screen.findByText('No reminders yet')).toBeInTheDocument();
  });

  it('renders a retryable error state when the first load fails', async () => {
    const user = userEvent.setup();
    serveSources([]);
    server.use(
      http.get(remindersEndpoint, () => new HttpResponse(null, { status: 500 }), { once: true }),
    );
    renderPanel();

    expect(await screen.findByText('Reminders could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No reminders yet')).toBeInTheDocument();
  });

  it('keeps the list and offers a retry when a refresh after a write fails', async () => {
    const user = userEvent.setup();
    serveSources([createMockReminderResponse({ dueDate: '2999-05-12' })]);
    server.use(
      http.put(reminderEndpoint, () => {
        server.use(http.get(remindersEndpoint, () => new HttpResponse(null, { status: 500 })));

        return HttpResponse.json(
          createMockReminderResponse({
            completedAt: '2026-05-12T10:00:00Z',
            dueDate: '2999-05-12',
          }),
        );
      }),
    );
    renderPanel();

    await user.click(
      await screen.findByRole('checkbox', { name: 'Complete Follow up with recruiter' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load reminders');
    expect(
      screen.getByRole('checkbox', { name: 'Complete Follow up with recruiter' }),
    ).toBeChecked();
    expect(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Try again' }),
    ).toBeEnabled();
  });
});
