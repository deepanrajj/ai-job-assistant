import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useJobContacts } from './useJobContacts';
import { MOCK_CONTACT_IDS, createMockContactResponse } from '../../test/mockContacts';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { server } from '../../test/server';
import type { IContactFormValues } from '../../services';

const newContactValues: IContactFormValues = {
  email: '',
  lastContactedAt: '',
  name: 'New Contact',
  notes: '',
  phone: '',
  profileUrl: '',
  type: 'RECRUITER',
};

const JobContactsProbe = () => {
  const {
    contacts,
    createJobContact,
    deleteJobContact,
    isLoading,
    loadError,
    mutationError,
    reload,
    updateJobContact,
  } = useJobContacts(MOCK_JOB_IDS.celonis);

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
        {contacts.map((contact) => (
          <li key={contact.id}>{contact.name}</li>
        ))}
      </ul>
      <button
        onClick={() =>
          createJobContact(newContactValues).catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        create
      </button>
      <button
        onClick={() =>
          updateJobContact(MOCK_CONTACT_IDS.primary, {
            ...newContactValues,
            name: 'Updated Name',
          }).catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        update
      </button>
      <button
        onClick={() =>
          deleteJobContact(MOCK_CONTACT_IDS.primary).catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        delete
      </button>
    </div>
  );
};

describe('useJobContacts', () => {
  it('loads and maps contacts', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () =>
        HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })]),
      ),
    );
    render(<JobContactsProbe />);

    expect(await screen.findByText('Jane Recruiter')).toBeInTheDocument();
  });

  it('records a load error and retries', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })]);
      }),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    expect(await screen.findByText(/load-error:/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'retry' }));

    expect(await screen.findByText('Jane Recruiter')).toBeInTheDocument();
  });

  it('reloads the list after a successful create', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'New Contact' }),
            ]);
      }),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () =>
        HttpResponse.json(
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'New Contact' }),
          { status: 201 },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await screen.findByRole('button', { name: 'create' });
    await user.click(screen.getByRole('button', { name: 'create' }));

    expect(await screen.findByText('New Contact')).toBeInTheDocument();
  });

  it('records a mutation error and does not reload on a failed create', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () => HttpResponse.json([])),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await user.click(await screen.findByRole('button', { name: 'create' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.queryByText('New Contact')).not.toBeInTheDocument();
  });

  it('sends blank optional fields as null on create', async () => {
    let postBody: unknown;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () => HttpResponse.json([])),
      http.post(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, async ({ request }) => {
        postBody = await request.json();

        return HttpResponse.json(
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'New Contact' }),
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await user.click(await screen.findByRole('button', { name: 'create' }));

    await waitFor(() =>
      expect(postBody).toEqual({
        type: 'RECRUITER',
        name: 'New Contact',
        email: null,
        phone: null,
        profileUrl: null,
        lastContactedAt: null,
        notes: null,
      }),
    );
  });

  it('sends every field on update and reloads', async () => {
    let putBody: unknown;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () =>
        HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })]),
      ),
      http.put(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/contacts/${MOCK_CONTACT_IDS.primary}`,
        async ({ request }) => {
          putBody = await request.json();

          return HttpResponse.json(
            createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Updated Name' }),
          );
        },
      ),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await screen.findByText('Jane Recruiter');
    await user.click(screen.getByRole('button', { name: 'update' }));

    await waitFor(() =>
      expect(putBody).toEqual({
        type: 'RECRUITER',
        name: 'Updated Name',
        email: null,
        phone: null,
        profileUrl: null,
        lastContactedAt: null,
        notes: null,
      }),
    );
  });

  it('records a mutation error and does not reload on a failed update', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () =>
        HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })]),
      ),
      http.put(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts/${MOCK_CONTACT_IDS.primary}`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await screen.findByText('Jane Recruiter');
    await user.click(screen.getByRole('button', { name: 'update' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
  });

  it('reloads the list after a successful delete', async () => {
    let callCount = 0;
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })])
          : HttpResponse.json([]);
      }),
      http.delete(
        `/api/jobs/${MOCK_JOB_IDS.celonis}/contacts/${MOCK_CONTACT_IDS.primary}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await screen.findByText('Jane Recruiter');
    await user.click(screen.getByRole('button', { name: 'delete' }));

    await waitFor(() => expect(screen.queryByText('Jane Recruiter')).not.toBeInTheDocument());
  });

  it('records a mutation error and does not reload on a failed delete', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`, () =>
        HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })]),
      ),
      http.delete(`/api/jobs/${MOCK_JOB_IDS.celonis}/contacts/${MOCK_CONTACT_IDS.primary}`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<JobContactsProbe />);

    await screen.findByText('Jane Recruiter');
    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(await screen.findByText(/mutation-error:/)).toBeInTheDocument();
    expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
  });
});
