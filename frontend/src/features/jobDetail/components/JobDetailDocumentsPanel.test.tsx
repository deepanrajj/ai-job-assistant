import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { JobDetailDocumentsPanel } from './JobDetailDocumentsPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { MOCK_DOCUMENT_IDS, createMockDocumentResponse } from '../../../test/mockDocuments';
import { MOCK_JOB_IDS } from '../../../test/mockJobs';
import { server } from '../../../test/server';
import type { TDocumentResponse } from '../../../services';

const JOB_ID = MOCK_JOB_IDS.celonis;
const documentsEndpoint = `/api/jobs/${JOB_ID}/documents`;
const documentEndpoint = `${documentsEndpoint}/${MOCK_DOCUMENT_IDS.primary}`;

const serveDocuments = (documents: TDocumentResponse[]) => {
  server.use(http.get(documentsEndpoint, () => HttpResponse.json(documents)));
};

const renderPanel = () => renderWithProviders(<JobDetailDocumentsPanel jobId={JOB_ID} />);

/**
 * The add form is the only one holding the "Add document" button; scoping
 * to it keeps field queries unambiguous once a row is open for editing.
 */
const getAddForm = async (): Promise<HTMLElement> =>
  (await screen.findByRole('button', { name: 'Add document' })).closest('form') as HTMLElement;

describe('JobDetailDocumentsPanel', () => {
  it('renders a document with its type, label, link, submitted date, and notes', async () => {
    serveDocuments([
      createMockDocumentResponse({
        notes: 'Backend-focused.',
        submittedAt: '2026-05-10',
        type: 'PORTFOLIO',
        url: 'https://github.com/example/portfolio',
      }),
    ]);
    renderPanel();

    const row = (await screen.findByText('CV - backend v3')).closest('li') as HTMLElement;

    expect(within(row).getByText('Portfolio')).toBeInTheDocument();
    expect(within(row).getByText('Submitted May 10, 2026')).toBeInTheDocument();
    expect(within(row).getByText('Backend-focused.')).toBeInTheDocument();

    const link = within(row).getByRole('link', { name: 'https://github.com/example/portfolio' });

    expect(link).toHaveAttribute('href', 'https://github.com/example/portfolio');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('says a document has not been sent when it has no submitted date', async () => {
    serveDocuments([createMockDocumentResponse()]);
    renderPanel();

    expect(await screen.findByText('Not sent yet')).toBeInTheDocument();
  });

  it('shows an empty state inside the labelled Documents card when there are none', async () => {
    serveDocuments([]);
    renderPanel();

    const heading = await screen.findByRole('heading', { name: 'Documents' });
    const card = heading.closest('section') ?? heading.parentElement?.parentElement;

    expect(within(card as HTMLElement).getByText('No documents yet')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Documents for this job' })).not.toBeInTheDocument();
  });

  it('saves a document with only the required fields, sending blank optionals as null', async () => {
    const user = userEvent.setup();
    serveDocuments([]);
    let body: unknown;
    server.use(
      http.post(documentsEndpoint, async ({ request }) => {
        body = await request.json();
        const created = createMockDocumentResponse({
          title: 'Cover letter v1',
          type: 'COVER_LETTER',
        });
        serveDocuments([created]);

        return HttpResponse.json(created, { status: 201 });
      }),
    );
    renderPanel();

    const form = await getAddForm();
    const addButton = within(form).getByRole('button', { name: 'Add document' });

    expect(addButton).toBeDisabled();

    await user.selectOptions(within(form).getByLabelText('Type'), 'COVER_LETTER');
    await user.type(within(form).getByLabelText('Version label'), '  Cover letter v1 ');
    await user.click(addButton);

    expect(await screen.findByText('Cover letter v1')).toBeInTheDocument();
    expect(body).toEqual({
      notes: null,
      submittedAt: null,
      title: 'Cover letter v1',
      type: 'COVER_LETTER',
      url: null,
    });
    expect(within(form).getByLabelText('Version label')).toHaveValue('');
  });

  it('saves a submitted date and link', async () => {
    const user = userEvent.setup();
    serveDocuments([]);
    let body: unknown;
    server.use(
      http.post(documentsEndpoint, async ({ request }) => {
        body = await request.json();
        serveDocuments([createMockDocumentResponse()]);

        return HttpResponse.json(createMockDocumentResponse(), { status: 201 });
      }),
    );
    renderPanel();

    const form = await getAddForm();

    await user.type(within(form).getByLabelText('Version label'), 'CV v3');
    await user.type(within(form).getByLabelText('Link'), 'https://example.com/cv');
    await user.type(within(form).getByLabelText('Submitted on'), '2026-05-10');
    await user.click(within(form).getByRole('button', { name: 'Add document' }));

    await screen.findByText('CV - backend v3');
    expect(body).toMatchObject({ submittedAt: '2026-05-10', url: 'https://example.com/cv' });
  });

  it('blocks a link that is not http(s) and says why', async () => {
    const user = userEvent.setup();
    serveDocuments([]);
    renderPanel();

    const form = await getAddForm();

    await user.type(within(form).getByLabelText('Version label'), 'CV v3');
    await user.type(within(form).getByLabelText('Link'), 'javascript:alert(1)');

    expect(within(form).getByText('Link must start with http:// or https://')).toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Add document' })).toBeDisabled();
  });

  it('edits a document in place', async () => {
    const user = userEvent.setup();
    serveDocuments([createMockDocumentResponse()]);
    let body: unknown;
    server.use(
      http.put(documentEndpoint, async ({ request }) => {
        body = await request.json();
        const updated = createMockDocumentResponse({ submittedAt: '2026-05-12' });
        serveDocuments([updated]);

        return HttpResponse.json(updated);
      }),
    );
    renderPanel();

    await user.click(await screen.findByRole('button', { name: 'Edit document CV - backend v3' }));
    const editRow = screen
      .getByRole('button', { name: 'Save document' })
      .closest('li') as HTMLElement;

    await user.type(within(editRow).getByLabelText('Submitted on'), '2026-05-12');
    await user.click(within(editRow).getByRole('button', { name: 'Save document' }));

    expect(await screen.findByText('Submitted May 12, 2026')).toBeInTheDocument();
    expect(body).toMatchObject({ submittedAt: '2026-05-12', title: 'CV - backend v3' });
  });

  it('deletes a document', async () => {
    const user = userEvent.setup();
    serveDocuments([createMockDocumentResponse()]);
    server.use(
      http.delete(documentEndpoint, () => {
        serveDocuments([]);

        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPanel();

    await user.click(
      await screen.findByRole('button', { name: 'Delete document CV - backend v3' }),
    );

    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
  });

  it('shows a failed save as an alert and keeps the typed values', async () => {
    const user = userEvent.setup();
    serveDocuments([]);
    server.use(http.post(documentsEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderPanel();

    const form = await getAddForm();

    await user.type(within(form).getByLabelText('Version label'), 'CV v3');
    await user.click(within(form).getByRole('button', { name: 'Add document' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to create document');
    expect(within(form).getByLabelText('Version label')).toHaveValue('CV v3');
  });

  it('renders a retryable error when the first load fails', async () => {
    const user = userEvent.setup();
    serveDocuments([]);
    server.use(
      http.get(documentsEndpoint, () => new HttpResponse(null, { status: 500 }), { once: true }),
    );
    renderPanel();

    expect(await screen.findByText('Documents could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
  });
});
