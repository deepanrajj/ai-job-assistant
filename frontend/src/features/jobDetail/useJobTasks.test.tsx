import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useJobTasks } from './useJobTasks';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { MOCK_TASK_IDS, createMockTaskResponse } from '../../test/mockTasks';
import { server } from '../../test/server';

const JobTasksProbe = () => {
  const {
    createJobTask,
    deleteJobTask,
    isLoading,
    loadError,
    mutationError,
    reload,
    tasks,
    updateJobTask,
  } = useJobTasks(MOCK_JOB_IDS.celonis);

  if (isLoading) return <p>loading</p>;
  if (loadError)
    return (
      <div>
        <p>load-error: {loadError.message}</p>
        <button onClick={reload}>retry</button>
      </div>
    );

  return (
    <div>
      {mutationError && <p>mutation-error: {mutationError.message}</p>}
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title}=[{task.dueDate}] status={task.status}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          createJobTask('New task', '2026-06-20').catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        create
      </button>
      <button
        onClick={() =>
          updateJobTask(MOCK_TASK_IDS.primary, { status: 'DONE' }).catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        toggle
      </button>
      <button onClick={() => updateJobTask('missing-task-id', { status: 'DONE' })}>
        toggle-missing
      </button>
      <button
        onClick={() =>
          deleteJobTask(MOCK_TASK_IDS.primary).catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        delete
      </button>
    </div>
  );
};

describe('useJobTasks', () => {
  it('loads and maps tasks, converting a null due date to an empty string', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([
          createMockTaskResponse({
            id: MOCK_TASK_IDS.primary,
            title: 'Tailor CV bullets',
            dueDate: null,
          }),
        ]),
      ),
    );
    render(<JobTasksProbe />);

    expect(await screen.findByText('Tailor CV bullets=[] status=TODO')).toBeInTheDocument();
  });

  it('records a load error and retries', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary })]);
      }),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    expect(await screen.findByText(/load-error:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'retry' }));

    expect(
      await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO'),
    ).toBeInTheDocument();
  });

  it('reloads the list after a successful create', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'New task' }),
            ]);
      }),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json(
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, title: 'New task' }),
          {
            status: 201,
          },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByRole('button', { name: 'create' });
    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(await screen.findByText('New task=[2026-05-10] status=TODO')).toBeInTheDocument();
  });

  it('records a mutation error and does not reload on a failed create', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () => HttpResponse.json([])),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await user.click(await screen.findByRole('button', { name: 'create' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.queryByText('New task=[2026-05-10] status=TODO')).not.toBeInTheDocument();
  });

  it('sends the full replacement body, merged from the loaded task, on update', async () => {
    let putBody: unknown;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([
          createMockTaskResponse({
            id: MOCK_TASK_IDS.primary,
            title: 'Tailor CV bullets',
            status: 'TODO',
          }),
        ]),
      ),
      http.put(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`,
        async ({ request }) => {
          putBody = await request.json();

          return HttpResponse.json(
            createMockTaskResponse({
              id: MOCK_TASK_IDS.primary,
              title: 'Tailor CV bullets',
              status: 'DONE',
            }),
          );
        },
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    await waitFor(() =>
      expect(putBody).toEqual({
        title: 'Tailor CV bullets',
        status: 'DONE',
        dueDate: '2026-05-10',
      }),
    );
  });

  it('shows the new status immediately, before the update request resolves', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'TODO' })]),
      ),
      http.put(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`,
        () => new Promise(() => {}),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(
      await screen.findByText('Tailor CV bullets=[2026-05-10] status=DONE'),
    ).toBeInTheDocument();
  });

  it('keeps the new status after a successful update, with no second list fetch', async () => {
    let getCallCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () => {
        getCallCount += 1;

        return HttpResponse.json([
          createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'TODO' }),
        ]);
      }),
      http.put(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`, () =>
        HttpResponse.json(createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'DONE' })),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(
      await screen.findByText('Tailor CV bullets=[2026-05-10] status=DONE'),
    ).toBeInTheDocument();
    expect(getCallCount).toBe(1);
  });

  it('lets a later reload replace a confirmed override instead of re-merging it', async () => {
    let getCallCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () => {
        getCallCount += 1;

        // Both GETs answer with the primary task at TODO - deliberately
        // not DONE, to stand in for a change this hook did not itself
        // make (another tab, a future feature) - the scenario a stale,
        // never-invalidated override would otherwise survive.
        return HttpResponse.json([
          createMockTaskResponse({
            id: MOCK_TASK_IDS.primary,
            status: 'TODO',
          }),
          ...(getCallCount > 1
            ? [
                createMockTaskResponse({
                  id: MOCK_TASK_IDS.secondary,
                  title: 'Practice system design',
                }),
              ]
            : []),
        ]);
      }),
      http.put(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`, () =>
        HttpResponse.json(createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'DONE' })),
      ),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json(
          createMockTaskResponse({
            id: MOCK_TASK_IDS.secondary,
            title: 'Practice system design',
          }),
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await screen.findByText('Tailor CV bullets=[2026-05-10] status=DONE');

    // An unrelated create reloads the whole list. The fresh GET's own
    // answer for the primary task (TODO) must win, not the confirmed-but-now
    // superseded DONE override left over from the toggle above.
    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(
      await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO'),
    ).toBeInTheDocument();
  });

  it('rolls a second failed toggle back to the first, already-successful toggle', async () => {
    let putCallCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'TODO' })]),
      ),
      http.put(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`, () => {
        putCallCount += 1;

        return putCallCount === 1
          ? HttpResponse.json(createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'DONE' }))
          : HttpResponse.json({ message: 'boom' }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    // First toggle succeeds and is never reloaded from the server.
    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await screen.findByText('Tailor CV bullets=[2026-05-10] status=DONE');

    // The second toggle (still to DONE, since the probe's button always
    // sends the same status) fails; rolling back must land on the first
    // toggle's result, not the original TODO the list was loaded with.
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Tailor CV bullets=[2026-05-10] status=DONE')).toBeInTheDocument();
  });

  it('does nothing when asked to update a task that is not in the loaded list', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary })]),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');

    // No PUT handler is registered for this job, so a request here would
    // fail the test under `setupTests.ts`'s `onUnhandledRequest: 'error'`.
    await user.click(screen.getByRole('button', { name: 'toggle-missing' }));

    expect(screen.getByText('Tailor CV bullets=[2026-05-10] status=TODO')).toBeInTheDocument();
  });

  it('records a mutation error and does not reload on a failed update', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary, status: 'TODO' })]),
      ),
      http.put(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Tailor CV bullets=[2026-05-10] status=TODO')).toBeInTheDocument();
  });

  it('reloads the list after a successful delete', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary })])
          : HttpResponse.json([]);
      }),
      http.delete(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'delete' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Tailor CV bullets=[2026-05-10] status=TODO'),
      ).not.toBeInTheDocument(),
    );
  });

  it('records a mutation error and does not reload on a failed delete', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks`, () =>
        HttpResponse.json([createMockTaskResponse({ id: MOCK_TASK_IDS.primary })]),
      ),
      http.delete(`/api/jobs/${MOCK_JOB_IDS.celonis}/tasks/${MOCK_TASK_IDS.primary}`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobTasksProbe />);

    await screen.findByText('Tailor CV bullets=[2026-05-10] status=TODO');
    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Tailor CV bullets=[2026-05-10] status=TODO')).toBeInTheDocument();
  });
});
