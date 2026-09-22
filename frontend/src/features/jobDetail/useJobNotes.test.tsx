import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useJobNotes } from './useJobNotes';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { MOCK_NOTE_IDS, createMockNoteResponse } from '../../test/mockNotes';
import { server } from '../../test/server';

const JobNotesProbe = () => {
  const {
    createJobNote,
    deleteJobNote,
    isLoading,
    loadError,
    mutationError,
    notes,
    reload,
    updateJobNote,
  } = useJobNotes(MOCK_JOB_IDS.celonis);

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
        {notes.map((note) => (
          <li key={note.id}>{note.body}</li>
        ))}
      </ul>
      <button
        onClick={() =>
          createJobNote('New note').catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        create
      </button>
      <button
        onClick={() =>
          updateJobNote(MOCK_NOTE_IDS.primary, 'Updated body').catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        update
      </button>
      <button
        onClick={() =>
          deleteJobNote(MOCK_NOTE_IDS.primary).catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        delete
      </button>
    </div>
  );
};

describe('useJobNotes', () => {
  it('loads and maps notes', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () =>
        HttpResponse.json([createMockNoteResponse({ id: MOCK_NOTE_IDS.primary })]),
      ),
    );
    render(<JobNotesProbe />);

    expect(await screen.findByText('Recruiter called back')).toBeInTheDocument();
  });

  it('records a load error and retries', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([createMockNoteResponse({ id: MOCK_NOTE_IDS.primary })]);
      }),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    expect(await screen.findByText(/load-error:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'retry' }));

    expect(await screen.findByText('Recruiter called back')).toBeInTheDocument();
  });

  it('reloads the list after a successful create', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockNoteResponse({ id: MOCK_NOTE_IDS.primary, body: 'New note' }),
            ]);
      }),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () =>
        HttpResponse.json(createMockNoteResponse({ id: MOCK_NOTE_IDS.primary, body: 'New note' }), {
          status: 201,
        }),
      ),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    await screen.findByRole('button', { name: 'create' });
    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(await screen.findByText('New note')).toBeInTheDocument();
  });

  it('records a mutation error and does not reload on a failed create', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () => HttpResponse.json([])),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    await user.click(await screen.findByRole('button', { name: 'create' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.queryByText('New note')).not.toBeInTheDocument();
  });

  it('sends exactly the given body on update and reloads', async () => {
    let putBody: unknown;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () =>
        HttpResponse.json([createMockNoteResponse({ id: MOCK_NOTE_IDS.primary })]),
      ),
      http.put(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/notes/${MOCK_NOTE_IDS.primary}`,
        async ({ request }) => {
          putBody = await request.json();

          return HttpResponse.json(
            createMockNoteResponse({ id: MOCK_NOTE_IDS.primary, body: 'Updated body' }),
          );
        },
      ),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    await screen.findByText('Recruiter called back');
    await user.click(screen.getByRole('button', { name: 'update' }));

    await waitFor(() => expect(putBody).toEqual({ body: 'Updated body' }));
  });

  it('records a mutation error and does not reload on a failed update', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () =>
        HttpResponse.json([createMockNoteResponse({ id: MOCK_NOTE_IDS.primary })]),
      ),
      http.put(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes/${MOCK_NOTE_IDS.primary}`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    await screen.findByText('Recruiter called back');
    await user.click(screen.getByRole('button', { name: 'update' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Recruiter called back')).toBeInTheDocument();
  });

  it('reloads the list after a successful delete', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([createMockNoteResponse({ id: MOCK_NOTE_IDS.primary })])
          : HttpResponse.json([]);
      }),
      http.delete(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/notes/${MOCK_NOTE_IDS.primary}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    await screen.findByText('Recruiter called back');
    await user.click(screen.getByRole('button', { name: 'delete' }));

    await waitFor(() =>
      expect(screen.queryByText('Recruiter called back')).not.toBeInTheDocument(),
    );
  });

  it('records a mutation error and does not reload on a failed delete', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes`, () =>
        HttpResponse.json([createMockNoteResponse({ id: MOCK_NOTE_IDS.primary })]),
      ),
      http.delete(`/api/jobs/${MOCK_JOB_IDS.celonis}/notes/${MOCK_NOTE_IDS.primary}`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobNotesProbe />);

    await screen.findByText('Recruiter called back');
    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Recruiter called back')).toBeInTheDocument();
  });
});
