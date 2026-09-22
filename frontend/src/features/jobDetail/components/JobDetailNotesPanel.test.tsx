import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailNotesPanel } from './JobDetailNotesPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { MOCK_JOB_IDS } from '../../../test/mockJobs';
import { MOCK_NOTE_IDS, createMockNoteResponse } from '../../../test/mockNotes';
import { server } from '../../../test/server';

const mockNotesEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}/notes`;
const mockNoteEndpoint = `${mockNotesEndpoint}/${MOCK_NOTE_IDS.primary}`;

describe('JobDetailNotesPanel', () => {
  it('renders saved notes with localized dates', async () => {
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json([
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.primary,
            body: 'Saved the role because Celonis has a strong fit.',
            createdAt: '2026-05-10T09:00:00.123456Z',
          }),
        ]),
      ),
    );
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText(/Saved the role because Celonis/)).toBeInTheDocument();
    expect(screen.getByText('May 10, 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit note from May 10, 2026')).not.toBeDisabled();
  });

  it('renders the loading state while the request is in flight', () => {
    server.use(http.get(mockNotesEndpoint, () => new Promise(() => {})));
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading notes')).toBeInTheDocument();
  });

  it('renders the load error state with a working retry', async () => {
    let callCount = 0;
    server.use(
      http.get(mockNotesEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Notes could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  });

  it('creates a note and reloads the list', async () => {
    let callCount = 0;
    server.use(
      http.get(mockNotesEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockNoteResponse({
                id: MOCK_NOTE_IDS.primary,
                body: 'Ask about team rituals',
              }),
            ]);
      }),
      http.post(mockNotesEndpoint, () =>
        HttpResponse.json(
          createMockNoteResponse({ id: MOCK_NOTE_IDS.primary, body: 'Ask about team rituals' }),
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(await screen.findByText('Ask about team rituals')).toBeInTheDocument();
  });

  it('keeps the create form filled in when the create request fails', async () => {
    server.use(
      http.get(mockNotesEndpoint, () => HttpResponse.json([])),
      http.post(mockNotesEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('New note')).toHaveValue('Ask about team rituals');
  });

  it('edits and saves a note', async () => {
    let callCount = 0;
    server.use(
      http.get(mockNotesEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([
              createMockNoteResponse({
                id: MOCK_NOTE_IDS.primary,
                body: 'Original body',
                createdAt: '2026-05-10T09:00:00.123456Z',
              }),
            ])
          : HttpResponse.json([
              createMockNoteResponse({
                id: MOCK_NOTE_IDS.primary,
                body: 'Updated note body',
                createdAt: '2026-05-10T09:00:00.123456Z',
              }),
            ]);
      }),
      http.put(mockNoteEndpoint, () =>
        HttpResponse.json(
          createMockNoteResponse({ id: MOCK_NOTE_IDS.primary, body: 'Updated note body' }),
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    const textarea = await screen.findByLabelText('Edit note from May 10, 2026');

    await user.clear(textarea);
    await user.type(textarea, 'Updated note body');
    await user.click(screen.getByRole('button', { name: 'Save note from May 10, 2026' }));

    expect(await screen.findByText('Updated note body')).toBeInTheDocument();
  });

  it('deletes a note', async () => {
    let isDeleted = false;
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json(
          isDeleted
            ? []
            : [
                createMockNoteResponse({
                  id: MOCK_NOTE_IDS.primary,
                  createdAt: '2026-05-10T09:00:00.123456Z',
                }),
              ],
        ),
      ),
      http.delete(mockNoteEndpoint, () => {
        isDeleted = true;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await screen.findByLabelText('Edit note from May 10, 2026');
    await user.click(screen.getByRole('button', { name: 'Delete note from May 10, 2026' }));

    await waitFor(() =>
      expect(screen.queryByLabelText('Edit note from May 10, 2026')).not.toBeInTheDocument(),
    );
  });

  it('renders a mutation failure from a failed save without losing the loaded notes', async () => {
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json([
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.primary,
            body: 'Recruiter called back',
            createdAt: '2026-05-10T09:00:00.123456Z',
          }),
        ]),
      ),
      http.put(mockNoteEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.click(await screen.findByRole('button', { name: 'Save note from May 10, 2026' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Recruiter called back')).toBeInTheDocument();
  });

  it('renders a mutation failure without losing the loaded notes', async () => {
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json([
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.primary,
            body: 'Recruiter called back',
            createdAt: '2026-05-10T09:00:00.123456Z',
          }),
        ]),
      ),
      http.delete(mockNoteEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.click(await screen.findByRole('button', { name: 'Delete note from May 10, 2026' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Recruiter called back')).toBeInTheDocument();
  });

  it('clears a stale mutation error once a later write succeeds', async () => {
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json([
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.primary,
            body: 'Recruiter called back',
            createdAt: '2026-05-10T09:00:00.123456Z',
          }),
        ]),
      ),
      http.post(mockNotesEndpoint, () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
      http.delete(mockNoteEndpoint, () => new HttpResponse(null, { status: 204 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete note from May 10, 2026' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('disables every note control while a write is in flight, marking only the busy one aria-busy', async () => {
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json([
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.primary,
            createdAt: '2026-05-10T09:00:00.123456Z',
          }),
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.secondary,
            createdAt: '2026-05-12T09:00:00.123456Z',
          }),
        ]),
      ),
      http.delete(mockNoteEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.click(await screen.findByRole('button', { name: 'Delete note from May 10, 2026' }));

    const busySaveButton = screen.getByRole('button', { name: 'Save note from May 10, 2026' });
    const busyDeleteButton = screen.getByRole('button', { name: 'Delete note from May 10, 2026' });
    const idleSaveButton = screen.getByRole('button', { name: 'Save note from May 12, 2026' });
    const idleDeleteButton = screen.getByRole('button', { name: 'Delete note from May 12, 2026' });
    const addNoteButton = screen.getByRole('button', { name: 'Add note' });

    // Every control stays disabled together - one write in flight blocks a
    // second overlapping one - but only the exact operation and row in
    // flight claims aria-busy. This note's own save button is disabled but
    // not itself updating, and the same goes for the other note's controls.
    expect(screen.getByLabelText('Edit note from May 10, 2026')).toBeDisabled();
    expect(busySaveButton).toBeDisabled();
    expect(busySaveButton).not.toHaveAttribute('aria-busy', 'true');
    expect(busyDeleteButton).toBeDisabled();
    expect(busyDeleteButton).toHaveAttribute('aria-busy', 'true');
    expect(idleSaveButton).toBeDisabled();
    expect(idleSaveButton).not.toHaveAttribute('aria-busy', 'true');
    expect(idleDeleteButton).toBeDisabled();
    expect(idleDeleteButton).not.toHaveAttribute('aria-busy', 'true');
    expect(addNoteButton).not.toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText('New note')).toBeDisabled();
  });

  it('marks only the note being saved as aria-busy', async () => {
    server.use(
      http.get(mockNotesEndpoint, () =>
        HttpResponse.json([
          createMockNoteResponse({
            id: MOCK_NOTE_IDS.primary,
            createdAt: '2026-05-10T09:00:00.123456Z',
          }),
        ]),
      ),
      http.put(mockNoteEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await screen.findByLabelText('Edit note from May 10, 2026');
    await user.click(screen.getByRole('button', { name: 'Save note from May 10, 2026' }));

    expect(screen.getByRole('button', { name: 'Save note from May 10, 2026' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Delete note from May 10, 2026' }),
    ).not.toHaveAttribute('aria-busy', 'true');
  });

  it('marks the add-note button aria-busy while creating', async () => {
    server.use(
      http.get(mockNotesEndpoint, () => HttpResponse.json([])),
      http.post(mockNotesEndpoint, () => new Promise(() => {})),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    await user.type(await screen.findByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(screen.getByRole('button', { name: 'Add note' })).toHaveAttribute('aria-busy', 'true');
  });

  it('ignores empty note submissions', async () => {
    let createCallCount = 0;
    server.use(
      http.get(mockNotesEndpoint, () => HttpResponse.json([])),
      http.post(mockNotesEndpoint, () => {
        createCallCount += 1;

        return HttpResponse.json(createMockNoteResponse(), { status: 201 });
      }),
    );
    renderWithProviders(<JobDetailNotesPanel jobId={MOCK_JOB_IDS.celonis} />);

    fireEvent.submit((await screen.findByLabelText('New note')).closest('form')!);

    expect(createCallCount).toBe(0);
  });
});
