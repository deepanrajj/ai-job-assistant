import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ApplicationsPage } from './ApplicationsPage';
import { AppError } from '../../errors';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobs } from '../../test/mockJobs';
import { APP_ERROR_CODES } from '../../types';
import type { TApplicationDocument } from '../../features/applications/applications.types';

const documents: TApplicationDocument[] = [
  {
    id: 'doc-1',
    jobId: MOCK_JOB_IDS.personio,
    submittedAt: '2026-05-12',
    title: 'CV - product v2',
    type: 'CV',
  },
  {
    id: 'doc-2',
    jobId: MOCK_JOB_IDS.celonis,
    submittedAt: '2026-05-10',
    title: 'CV - backend v3',
    type: 'CV',
  },
  {
    id: 'doc-3',
    jobId: MOCK_JOB_IDS.celonis,
    title: 'GitHub portfolio',
    type: 'PORTFOLIO',
    url: 'https://github.com/example/portfolio',
  },
  {
    id: 'doc-4',
    jobId: 'deleted-job',
    title: 'Orphan',
    type: 'OTHER',
  },
];

const renderPage = (overrides: Partial<ComponentProps<typeof ApplicationsPage>> = {}) =>
  renderWithRouter(
    <ApplicationsPage
      documents={documents}
      error={null}
      isLoading={false}
      jobs={createMockJobs()}
      onRetry={() => {}}
      {...overrides}
    />,
  );

describe('ApplicationsPage', () => {
  it('groups documents under their job, latest submission first, with a link to each job', () => {
    renderPage();

    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);

    expect(headings).toEqual(['Personio', 'Celonis']);
    expect(screen.getByRole('link', { name: 'View details for Celonis' })).toHaveAttribute(
      'href',
      `/jobs/${MOCK_JOB_IDS.celonis}`,
    );
    expect(screen.queryByText('Orphan')).not.toBeInTheDocument();
  });

  it('shows each document’s type, label, submitted date, and link', () => {
    renderPage();

    const celonis = screen.getByRole('list', { name: 'Documents for Celonis' });
    const rows = within(celonis).getAllByRole('listitem');

    expect(rows[0]).toHaveTextContent('CV - backend v3');
    expect(rows[0]).toHaveTextContent('Submitted May 10, 2026');
    expect(rows[1]).toHaveTextContent('Portfolio');
    expect(rows[1]).toHaveTextContent('Not sent yet');
    expect(within(rows[1]).getByRole('link', { name: 'Open link' })).toHaveAttribute(
      'href',
      'https://github.com/example/portfolio',
    );
  });

  it('explains how to add documents when there are none', () => {
    renderPage({ documents: [] });

    expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument();
    expect(screen.getByText('No application documents yet')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    renderPage({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading applications');
  });

  it('shows an error with a working retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderPage({
      error: new AppError('Failed', APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED),
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Applications could not be loaded');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
