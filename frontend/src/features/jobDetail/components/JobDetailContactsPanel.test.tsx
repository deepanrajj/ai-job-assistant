import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailContactsPanel } from './JobDetailContactsPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { MOCK_CONTACT_IDS, createMockContactResponse } from '../../../test/mockContacts';
import { MOCK_JOB_IDS } from '../../../test/mockJobs';
import { server } from '../../../test/server';

const mockContactsEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}/contacts`;
const mockContactEndpoint = `${mockContactsEndpoint}/${MOCK_CONTACT_IDS.primary}`;

/**
 * The add-contact form is the only "Name" field rendered while nothing is
 * being edited, but once a row opens for editing there are two: scoping to
 * the form that owns the "Add contact" button keeps queries unambiguous.
 */
const getAddContactForm = async (): Promise<HTMLElement> =>
  (await screen.findByRole('button', { name: 'Add contact' })).closest('form') as HTMLElement;

describe('JobDetailContactsPanel', () => {
  it('renders saved contacts with their details', async () => {
    server.use(
      http.get(mockContactsEndpoint, () =>
        HttpResponse.json([
          createMockContactResponse({
            id: MOCK_CONTACT_IDS.primary,
            name: 'Jane Recruiter',
            email: 'jane@example.com',
            phone: '+49 170 1234567',
            profileUrl: 'https://www.linkedin.com/in/jane-recruiter',
            lastContactedAt: '2026-05-10',
            notes: 'Reached out on LinkedIn.',
          }),
        ]),
      ),
    );
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    const contactRow = screen.getByText('Jane Recruiter').closest('li') as HTMLElement;
    expect(within(contactRow).getByText('Recruiter')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'jane@example.com' })).toHaveAttribute(
      'href',
      'mailto:jane@example.com',
    );
    expect(screen.getByText('+49 170 1234567')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://www.linkedin.com/in/jane-recruiter' }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/in/jane-recruiter');
    expect(screen.getByText('Last contacted May 10, 2026')).toBeInTheDocument();
    expect(screen.getByText('Reached out on LinkedIn.')).toBeInTheDocument();
  });

  it('shows "not contacted yet" when no last contacted date is set', async () => {
    server.use(
      http.get(mockContactsEndpoint, () =>
        HttpResponse.json([
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, lastContactedAt: null }),
        ]),
      ),
    );
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByText('Not contacted yet')).toBeInTheDocument();
  });

  it('renders the loading state while the request is in flight', () => {
    server.use(http.get(mockContactsEndpoint, () => new Promise(() => {})));
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading contacts')).toBeInTheDocument();
  });

  it('renders the load error state with a working retry', async () => {
    let callCount = 0;
    server.use(
      http.get(mockContactsEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json({ message: 'boom' }, { status: 500 })
          : HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Contacts could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
  });

  it('creates a contact with only the required name filled in and reloads the list', async () => {
    let callCount = 0;
    server.use(
      http.get(mockContactsEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'New Contact' }),
            ]);
      }),
      http.post(mockContactsEndpoint, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;

        expect(body).toEqual({
          type: 'RECRUITER',
          name: 'New Contact',
          email: null,
          phone: null,
          profileUrl: null,
          lastContactedAt: null,
          notes: null,
        });

        return HttpResponse.json(
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'New Contact' }),
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    const form = await getAddContactForm();

    await user.type(within(form).getByLabelText('Name'), 'New Contact');
    await user.click(within(form).getByRole('button', { name: 'Add contact' }));

    expect(await screen.findByText('New Contact')).toBeInTheDocument();
  });

  it('fills in every field and sends them all when creating a contact', async () => {
    let callCount = 0;
    server.use(
      http.get(mockContactsEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([])
          : HttpResponse.json([
              createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Alex Manager' }),
            ]);
      }),
      http.post(mockContactsEndpoint, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;

        expect(body).toEqual({
          type: 'HIRING_MANAGER',
          name: 'Alex Manager',
          email: 'alex@example.com',
          phone: '+1 555 0100',
          profileUrl: 'https://www.linkedin.com/in/alex-manager',
          lastContactedAt: '2026-07-01',
          notes: 'Met at the meetup.',
        });

        return HttpResponse.json(
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Alex Manager' }),
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    const form = await getAddContactForm();

    await user.selectOptions(within(form).getByLabelText('Type'), 'HIRING_MANAGER');
    await user.type(within(form).getByLabelText('Name'), 'Alex Manager');
    await user.type(within(form).getByLabelText('Email'), 'alex@example.com');
    await user.type(within(form).getByLabelText('Phone'), '+1 555 0100');
    await user.type(
      within(form).getByLabelText('Profile URL'),
      'https://www.linkedin.com/in/alex-manager',
    );
    await user.type(within(form).getByLabelText('Last contacted'), '2026-07-01');
    await user.type(within(form).getByLabelText('Notes'), 'Met at the meetup.');
    await user.click(within(form).getByRole('button', { name: 'Add contact' }));

    expect(await screen.findByText('Alex Manager')).toBeInTheDocument();
  });

  it('keeps the create form filled in when the create request fails', async () => {
    server.use(
      http.get(mockContactsEndpoint, () => HttpResponse.json([])),
      http.post(mockContactsEndpoint, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    const form = await getAddContactForm();

    await user.type(within(form).getByLabelText('Name'), 'New Contact');
    await user.click(within(form).getByRole('button', { name: 'Add contact' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(within(form).getByLabelText('Name')).toHaveValue('New Contact');
  });

  it('rejects a non-http(s) profile url and blocks submission', async () => {
    server.use(http.get(mockContactsEndpoint, () => HttpResponse.json([])));
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    const form = await getAddContactForm();

    await user.type(within(form).getByLabelText('Name'), 'New Contact');
    await user.type(within(form).getByLabelText('Profile URL'), 'javascript:alert(1)');

    expect(
      within(form).getByText('Profile URL must start with http:// or https://'),
    ).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Add contact' })).toBeDisabled();
  });

  it('cancels editing without saving', async () => {
    server.use(
      http.get(mockContactsEndpoint, () =>
        HttpResponse.json([
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Original Name' }),
        ]),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    await screen.findByText('Original Name');
    await user.click(screen.getByRole('button', { name: 'Edit contact Original Name' }));

    const nameInputs = screen.getAllByLabelText('Name');
    const editNameInput = nameInputs[nameInputs.length - 1];

    await user.clear(editNameInput);
    await user.type(editNameInput, 'Discarded Name');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Original Name')).toBeInTheDocument();
    expect(screen.queryByText('Discarded Name')).not.toBeInTheDocument();
  });

  it('edits and saves a contact', async () => {
    let callCount = 0;
    server.use(
      http.get(mockContactsEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json([
              createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Original Name' }),
            ])
          : HttpResponse.json([
              createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Updated Name' }),
            ]);
      }),
      http.put(mockContactEndpoint, () =>
        HttpResponse.json(
          createMockContactResponse({ id: MOCK_CONTACT_IDS.primary, name: 'Updated Name' }),
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    await screen.findByText('Original Name');
    await user.click(screen.getByRole('button', { name: 'Edit contact Original Name' }));

    const nameInputs = screen.getAllByLabelText('Name');
    const editNameInput = nameInputs[nameInputs.length - 1];

    await user.clear(editNameInput);
    await user.type(editNameInput, 'Updated Name');
    await user.click(screen.getByRole('button', { name: 'Save contact' }));

    expect(await screen.findByText('Updated Name')).toBeInTheDocument();
  });

  it('deletes a contact', async () => {
    let isDeleted = false;
    server.use(
      http.get(mockContactsEndpoint, () =>
        HttpResponse.json(
          isDeleted ? [] : [createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })],
        ),
      ),
      http.delete(mockContactEndpoint, () => {
        isDeleted = true;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    await screen.findByText('Jane Recruiter');
    await user.click(screen.getByRole('button', { name: 'Delete contact Jane Recruiter' }));

    await waitFor(() => expect(screen.queryByText('Jane Recruiter')).not.toBeInTheDocument());
  });

  it('renders a mutation failure without losing the loaded contacts', async () => {
    server.use(
      http.get(mockContactsEndpoint, () =>
        HttpResponse.json([createMockContactResponse({ id: MOCK_CONTACT_IDS.primary })]),
      ),
      http.delete(mockContactEndpoint, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<JobDetailContactsPanel jobId={MOCK_JOB_IDS.celonis} />);

    await screen.findByText('Jane Recruiter');
    await user.click(screen.getByRole('button', { name: 'Delete contact Jane Recruiter' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
  });
});
