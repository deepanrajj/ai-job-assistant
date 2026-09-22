import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailTasksPanel } from './JobDetailTasksPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { MOCK_JOB_IDS } from '../../../test/mockJobs';
import { MOCK_TASK_IDS, createMockTaskResponse } from '../../../test/mockTasks';
import { server } from '../../../test/server';

const mockTasksEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`;
const mockTaskEndpoint = `${mockTasksEndpoint}/${MOCK_TASK_IDS.primary}`;

describe('JobDetailTasksPanel', () => {
  it('renders task completion summary, task rows, and due dates', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({
            id: MOCK_TASK_IDS.primary,
            title: 'Tailor CV bullets for Senior Frontend Engineer',
            status: 'DONE',
            dueDate: '2026-05-10',
          }),
          createMockTaskResponse({
            id: MOCK_TASK_IDS.secondary,
            title: 'Prepare interview examples for Celonis',
            status: 'TODO',
            dueDate: null,
          }),
        ]),
      ),
    );
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByRole('heading', { name: 'Preparation tasks' })).toBeInTheDocument();
    expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Prepare interview examples for Celonis' }),
    ).not.toBeChecked();
    expect(screen.getByText('Due May 10, 2026')).toBeInTheDocument();
    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('renders the loading state while the request is in flight', () => {
    server.use(http.get(mockTasksEndpoint, () => new Promise(() => {})));
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading tasks')).toBeInTheDocument();
  });

  it('renders the load error state with a working retry', async () => {
    let callCount = 0;
    server.use(
      http.get(mockTasksEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Tasks could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('0 of 0 completed')).toBeInTheDocument();
  });

  it('creates a task and reloads the list', async () => {
    let callCount = 0;
    server.use(
      http.get(mockTasksEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockTaskResponse({
                id: MOCK_TASK_IDS.primary,
                title: 'Practice system design',
              }),
            ]);
      }),
      http.post(mockTasksEndpoint, () =>
        HttpResponse.json(
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Practice system design' }),
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('Task title'), 'Practice system design');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Practice system design')).toBeInTheDocument();
  });

  it('keeps the create form filled in when the create request fails', async () => {
    server.use(
      http.get(mockTasksEndpoint, () => HttpResponse.json([])),
      http.post(mockTasksEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('Task title'), 'Practice system design');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toHaveValue('Practice system design');
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-06-20');
  });

  it('clears a stale mutation error once a later write succeeds', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Tailor CV bullets' }),
        ]),
      ),
      http.post(mockTasksEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
      http.put(mockTaskEndpoint, () =>
        HttpResponse.json(
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Tailor CV bullets' }),
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('Task title'), 'Another task');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Tailor CV bullets' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('toggles a task complete and back, and deletes it', async () => {
    let taskStatus: 'TODO' | 'DONE' = 'TODO';
    let isDeleted = false;
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json(
          isDeleted
            ? []
            : [
                createMockTaskResponse({
                  id: MOCK_TASK_IDS.primary,
                  title: 'Tailor CV bullets',
                  status: taskStatus,
                }),
              ],
        ),
      ),
      http.put(mockTaskEndpoint, async ({ request }) => {
        const body = (await request.json()) as { status: 'TODO' | 'DONE' };

        taskStatus = body.status;

        return HttpResponse.json(
          createMockTaskResponse({
            id: MOCK_TASK_IDS.primary,
            title: 'Tailor CV bullets',
            status: taskStatus,
          }),
        );
      }),
      http.delete(mockTaskEndpoint, () => {
        isDeleted = true;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    const checkbox = await screen.findByRole('checkbox', { name: 'Tailor CV bullets' });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Tailor CV bullets' }));

    expect(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Delete task Tailor CV bullets' }));

    expect(screen.queryByRole('checkbox', { name: 'Tailor CV bullets' })).not.toBeInTheDocument();
  });

  it('renders a mutation failure from a failed delete without losing the loaded tasks', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Tailor CV bullets' }),
        ]),
      ),
      http.delete(mockTaskEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.click(await screen.findByRole('button', { name: 'Delete task Tailor CV bullets' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Tailor CV bullets')).toBeInTheDocument();
  });

  it('renders a mutation failure without losing the loaded tasks', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Tailor CV bullets' }),
        ]),
      ),
      http.put(mockTaskEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.click(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Tailor CV bullets')).toBeInTheDocument();
  });

  it('disables every task control while a write is in flight, marking only the busy one aria-busy', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Tailor CV bullets' }),
          createMockTaskResponse({ id: MOCK_TASK_IDS.secondary, title: 'Practice system design' }),
        ]),
      ),
      http.put(mockTaskEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    const busyCheckbox = await screen.findByRole('checkbox', { name: 'Tailor CV bullets' });

    await user.click(busyCheckbox);

    const idleCheckbox = screen.getByRole('checkbox', { name: 'Practice system design' });
    const busyDeleteButton = screen.getByRole('button', { name: 'Delete task Tailor CV bullets' });
    const idleDeleteButton = screen.getByRole('button', {
      name: 'Delete task Practice system design',
    });
    const addTaskButton = screen.getByRole('button', { name: 'Add task' });

    // Every control still stays disabled together - one write in flight
    // blocks a second overlapping one - but only the row actually being
    // written claims aria-busy. A control merely disabled by someone
    // else's write is not itself updating.
    expect(busyCheckbox).toBeDisabled();
    expect(busyCheckbox).toHaveAttribute('aria-busy', 'true');
    expect(idleCheckbox).toBeDisabled();
    expect(idleCheckbox).not.toHaveAttribute('aria-busy', 'true');
    expect(busyDeleteButton).toBeDisabled();
    expect(busyDeleteButton).not.toHaveAttribute('aria-busy', 'true');
    expect(idleDeleteButton).toBeDisabled();
    expect(idleDeleteButton).not.toHaveAttribute('aria-busy', 'true');
    expect(addTaskButton).not.toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('Task title')).toBeDisabled();
    expect(screen.getByLabelText('Due date')).toBeDisabled();
  });

  it('marks only the task being deleted as aria-busy', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'Tailor CV bullets' }),
          createMockTaskResponse({ id: MOCK_TASK_IDS.secondary, title: 'Practice system design' }),
        ]),
      ),
      http.delete(mockTaskEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.click(await screen.findByRole('button', { name: 'Delete task Tailor CV bullets' }));

    expect(screen.getByRole('button', { name: 'Delete task Tailor CV bullets' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Delete task Practice system design' }),
    ).not.toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('checkbox', { name: 'Tailor CV bullets' })).not.toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('marks the add-task button aria-busy while creating', async () => {
    server.use(
      http.get(mockTasksEndpoint, () => HttpResponse.json([])),
      http.post(mockTasksEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('Task title'), 'Practice system design');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByRole('button', { name: 'Add task' })).toHaveAttribute('aria-busy', 'true');
  });

  it('ignores empty task submissions', async () => {
    let createCallCount = 0;
    server.use(
      http.get(mockTasksEndpoint, () => HttpResponse.json([])),
      http.post(mockTasksEndpoint, () => {
        createCallCount += 1;

        return HttpResponse.json(createMockTaskResponse(), { status: 201 });
      }),
    );
    renderWithProviders(<JobDetailTasksPanel jobId={MOCK_JOB_IDS.celonis} />);

    fireEvent.submit((await screen.findByLabelText('Task title')).closest('form')!);

    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
    expect(createCallCount).toBe(0);
  });
});
