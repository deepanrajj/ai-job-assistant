import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailTasksPanel } from './JobDetailTasksPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockTaskResponse } from '../../../test/mockTasks';
import { server } from '../../../test/server';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const TASK_ID = 'a1111111-1111-4111-8111-111111111111';

const mockTasksEndpoint = `/api/jobs/${JOB_ID}/tasks`;
const mockTaskEndpoint = `${mockTasksEndpoint}/${TASK_ID}`;

describe('JobDetailTasksPanel', () => {
  it('renders task completion summary, task rows, and due dates', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([
          createMockTaskResponse({
            id: TASK_ID,
            title: 'Tailor CV bullets for Senior Frontend Engineer',
            status: 'DONE',
            dueDate: '2026-05-10',
          }),
          createMockTaskResponse({
            id: 'b2222222-2222-4222-8222-222222222222',
            title: 'Prepare interview examples for Celonis',
            status: 'TODO',
            dueDate: null,
          }),
        ]),
      ),
    );
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

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
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

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
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

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
              createMockTaskResponse({ id: TASK_ID, title: 'Practice system design' }),
            ]);
      }),
      http.post(mockTasksEndpoint, () =>
        HttpResponse.json(
          createMockTaskResponse({ id: TASK_ID, title: 'Practice system design' }),
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

    await user.type(await screen.findByLabelText('Task title'), 'Practice system design');
    await user.type(screen.getByLabelText('Due date'), '2026-06-20');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Practice system design')).toBeInTheDocument();
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
                  id: TASK_ID,
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
          createMockTaskResponse({ id: TASK_ID, title: 'Tailor CV bullets', status: taskStatus }),
        );
      }),
      http.delete(mockTaskEndpoint, () => {
        isDeleted = true;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

    const checkbox = await screen.findByRole('checkbox', { name: 'Tailor CV bullets' });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Tailor CV bullets' }));

    expect(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Delete task Tailor CV bullets' }));

    expect(screen.queryByRole('checkbox', { name: 'Tailor CV bullets' })).not.toBeInTheDocument();
  });

  it('renders a mutation failure without losing the loaded tasks', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([createMockTaskResponse({ id: TASK_ID, title: 'Tailor CV bullets' })]),
      ),
      http.put(mockTaskEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

    await user.click(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Tailor CV bullets')).toBeInTheDocument();
  });

  it('disables the form and task controls while a write is in flight', async () => {
    server.use(
      http.get(mockTasksEndpoint, () =>
        HttpResponse.json([createMockTaskResponse({ id: TASK_ID, title: 'Tailor CV bullets' })]),
      ),
      http.put(mockTaskEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

    await user.click(await screen.findByRole('checkbox', { name: 'Tailor CV bullets' }));

    expect(screen.getByRole('checkbox', { name: 'Tailor CV bullets' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete task Tailor CV bullets' })).toBeDisabled();
    expect(screen.getByLabelText('Task title')).toBeDisabled();
    expect(screen.getByLabelText('Due date')).toBeDisabled();
  });

  it('ignores empty task submissions', async () => {
    server.use(http.get(mockTasksEndpoint, () => HttpResponse.json([])));
    renderWithProviders(<JobDetailTasksPanel jobId={JOB_ID} />);

    fireEvent.submit((await screen.findByLabelText('Task title')).closest('form')!);

    expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
  });
});
