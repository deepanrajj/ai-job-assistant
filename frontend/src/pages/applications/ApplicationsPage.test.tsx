import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ApplicationsPage } from './ApplicationsPage';
import { AppError } from '../../errors';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJob, createMockJobs } from '../../test/mockJobs';
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
  it('shows a matrix of jobs by document type, latest submission first, from lg up', () => {
    renderPage();

    const table = screen.getByRole('table', { name: 'Documents by job and type' });
    const [header, ...rows] = within(table).getAllByRole('row');

    // Only the types in use get a column; the orphan's "Other" is left out.
    expect(
      within(header)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Job', 'CV', 'Portfolio', 'Actions']);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      expect.stringContaining('Personio'),
      expect.stringContaining('Celonis'),
    ]);
    expect(screen.queryByText('Orphan')).not.toBeInTheDocument();

    // Cells exclude the row header, so they line up with the type columns.
    const [celonisCv, celonisPortfolio] = within(rows[1]).getAllByRole('cell');

    expect(celonisCv).toHaveTextContent('CV - backend v3');
    expect(celonisCv).toHaveTextContent('Submitted May 10, 2026');
    expect(celonisPortfolio).toHaveTextContent('GitHub portfolio');
    expect(celonisPortfolio).toHaveTextContent('Not sent yet');
    expect(
      within(celonisPortfolio).getByRole('link', {
        name: 'Open link for GitHub portfolio',
      }),
    ).toHaveAttribute('href', 'https://github.com/example/portfolio');
    // Personio sent no portfolio.
    expect(within(rows[0]).getAllByRole('cell')[1]).toHaveTextContent('None');
    expect(within(rows[1]).getByRole('link', { name: 'Open job for Celonis' })).toHaveAttribute(
      'href',
      `/jobs/${MOCK_JOB_IDS.celonis}`,
    );
  });

  it('shows job cards below lg, with each document’s type, status, and link', () => {
    const originalMatchMedia = window.matchMedia;

    window.matchMedia = ((query: string) => ({
      ...originalMatchMedia(query),
      matches: false,
    })) as typeof window.matchMedia;

    try {
      renderPage();

      const materials = screen.getByRole('region', { name: 'Application materials' });
      const headings = within(materials)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent);

      expect(headings).toEqual(['Personio', 'Celonis']);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      // Cards are articles, not regions, so they do not flood the landmarks.
      expect(screen.getByRole('article', { name: 'Celonis' })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Celonis' })).not.toBeInTheDocument();
      // The matrix needs width, so narrow screens get cards and no switch.
      expect(screen.queryByRole('group', { name: 'Applications view' })).not.toBeInTheDocument();

      const rows = within(screen.getByRole('list', { name: 'Documents for Celonis' })).getAllByRole(
        'listitem',
      );

      expect(rows[0]).toHaveTextContent('CV - backend v3');
      expect(rows[0]).toHaveTextContent('Submitted May 10, 2026');
      expect(rows[1]).toHaveTextContent('Portfolio');
      expect(rows[1]).toHaveTextContent('Not sent yet');
      expect(
        within(rows[1]).getByRole('link', { name: 'Open link for GitHub portfolio' }),
      ).toHaveAttribute('href', 'https://github.com/example/portfolio');
      expect(screen.getByRole('link', { name: 'Open job for Celonis' })).toHaveAttribute(
        'href',
        `/jobs/${MOCK_JOB_IDS.celonis}`,
      );
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('switches between the matrix and job cards from lg up', async () => {
    const user = userEvent.setup();
    renderPage();

    const viewSwitch = screen.getByRole('group', { name: 'Applications view' });

    expect(within(viewSwitch).getByRole('button', { name: 'Matrix' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(viewSwitch).getByRole('button', { name: 'Cards' }));

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Documents for Celonis' })).toBeInTheDocument();
    expect(within(viewSwitch).getByRole('button', { name: 'Cards' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('searches by company, role, or document, and keeps the counts for every job', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'github');

    const table = screen.getByRole('table', { name: 'Documents by job and type' });

    expect(within(table).getAllByRole('rowheader')).toHaveLength(1);
    expect(within(table).getByRole('rowheader')).toHaveTextContent('Celonis');

    const summary = screen.getByRole('group', { name: 'Documents by status' });

    // Read the exact count: the search narrowed the list to one job.
    expect(
      within(summary).getByText('Jobs with documents').closest('div')?.querySelector('dd')
        ?.textContent,
    ).toBe('2');

    // A document's type label is searchable too.
    await user.clear(screen.getByRole('textbox', { name: 'Search' }));
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'portfolio');
    expect(within(table).getAllByRole('rowheader')).toHaveLength(1);

    await user.clear(screen.getByRole('textbox', { name: 'Search' }));
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'nothing like this');

    expect(screen.getByText('No matching applications')).toBeInTheDocument();
  });

  it('shows only jobs with an unsent document when filtered', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Show' }), 'unsent');

    const rowHeaders = within(
      screen.getByRole('table', { name: 'Documents by job and type' }),
    ).getAllByRole('rowheader');

    expect(rowHeaders).toHaveLength(1);
    expect(rowHeaders[0]).toHaveTextContent('Celonis');
  });

  it('keeps the matrix columns for every job while paging, and hides paging for short lists', async () => {
    const user = userEvent.setup();
    const manyJobs = Array.from({ length: 11 }, (_, index) =>
      createMockJob({ company: `Company ${index + 1}`, id: `job-${index + 1}` }),
    );
    // Only the last job, on page 2, has a portfolio.
    const manyDocuments: TApplicationDocument[] = manyJobs.map((job, index) => ({
      id: `doc-${index + 1}`,
      jobId: job.id,
      title: `Doc ${index + 1}`,
      type: index === 10 ? 'PORTFOLIO' : 'CV',
    }));
    const { unmount } = renderPage({ documents: manyDocuments, jobs: manyJobs });
    const headers = () =>
      within(screen.getByRole('table', { name: 'Documents by job and type' }))
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent);

    expect(headers()).toEqual(['Job', 'CV', 'Portfolio', 'Actions']);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(headers()).toEqual(['Job', 'CV', 'Portfolio', 'Actions']);
    unmount();

    renderPage();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.queryByText(/of 2 jobs/)).not.toBeInTheDocument();
  });

  it('pages through long lists, ten jobs at a time by default', async () => {
    const user = userEvent.setup();
    const manyJobs = Array.from({ length: 12 }, (_, index) =>
      createMockJob({ company: `Company ${index + 1}`, id: `job-${index + 1}` }),
    );
    const manyDocuments: TApplicationDocument[] = manyJobs.map((job, index) => ({
      id: `doc-${index + 1}`,
      jobId: job.id,
      title: `CV ${index + 1}`,
      type: 'CV',
    }));
    renderPage({ documents: manyDocuments, jobs: manyJobs });

    const rowHeaders = () =>
      within(screen.getByRole('table', { name: 'Documents by job and type' })).getAllByRole(
        'rowheader',
      );

    expect(rowHeaders()).toHaveLength(10);
    expect(screen.getByText('1-10 of 12 jobs')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(rowHeaders().map((header) => header.textContent)).toEqual([
      expect.stringContaining('Company 11'),
      expect.stringContaining('Company 12'),
    ]);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('keeps paging and the chosen page size while a search narrows a long list', async () => {
    const user = userEvent.setup();
    const manyJobs = Array.from({ length: 12 }, (_, index) =>
      createMockJob({ company: `Company ${index + 1}`, id: `job-${index + 1}` }),
    );
    const manyDocuments: TApplicationDocument[] = manyJobs.map((job, index) => ({
      id: `doc-${index + 1}`,
      jobId: job.id,
      title: `CV ${index + 1}`,
      type: 'CV',
    }));
    renderPage({ documents: manyDocuments, jobs: manyJobs });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '25');
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Company 12');

    expect(screen.getByText('1-1 of 1 jobs')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('25');
  });

  it('counts submitted and unsent documents and their jobs, leaving out deleted jobs', () => {
    renderPage();

    const summary = screen.getByRole('group', { name: 'Documents by status' });
    const countFor = (label: string) =>
      within(summary).getByText(label).closest('div')?.querySelector('dd')?.textContent;

    expect(countFor('Submitted')).toBe('2');
    expect(countFor('Not sent yet')).toBe('1');
    expect(countFor('Jobs with documents')).toBe('2');
  });

  it('explains how to add documents when there are none', () => {
    renderPage({ documents: [] });

    const materials = screen.getByRole('region', { name: 'Application materials' });

    expect(within(materials).getByText('No application documents yet')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Documents by status' })).not.toBeInTheDocument();
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
