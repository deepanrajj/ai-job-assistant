import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { JobsPage } from './JobsPage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { renderWithRouter } from '../../test/renderWithRouter';
import { createMockJob, createMockJobResponse, createMockJobs } from '../../test/mockJobs';
import { server } from '../../test/server';
import { APP_ERROR_CODES } from '../../types';

/**
 * Simulates a viewport below every breakpoint, i.e. a phone.
 */
const mockPhoneViewport = () => {
  // Swap rather than spy: spying on the setup file's mock and restoring it would wipe it.
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        addEventListener: vi.fn(),
        matches: false,
        media: query,
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );

  return () => {
    window.matchMedia = originalMatchMedia;
  };
};

const loadError = () => new AppError('Failed to load jobs', APP_ERROR_CODES.JOB_REQUEST_FAILED);

/**
 * Renders the page in its loaded, non-empty state unless a test says
 * otherwise, so each case states only the axis it exercises.
 */
const renderJobsPage = (overrides: Partial<ComponentProps<typeof JobsPage>> = {}) =>
  renderWithRouter(
    <JobsPage
      error={null}
      isLoading={false}
      jobs={createMockJobs()}
      onRetry={() => {}}
      {...overrides}
    />,
  );

describe('JobsPage', () => {
  it('searches saved jobs by company name', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search'), 'personio');

    expect(screen.getByRole('rowheader', { name: /Personio/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Celonis/i })).not.toBeInTheDocument();
  });

  it('filters saved jobs by status', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INTERVIEW');

    expect(screen.getByRole('rowheader', { name: /Celonis/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Personio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Miro/i })).not.toBeInTheDocument();
  });

  it('leaves the global Add Job action to the app shell', () => {
    renderJobsPage();

    expect(screen.queryByRole('button', { name: 'Add Job' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table' })).toBeInTheDocument();
  });

  it('renders the loading state while jobs are being fetched', () => {
    renderJobsPage({
      isLoading: true,
      jobs: [],
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading saved jobs');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  /**
   * The state a first-run user against an empty database lands on. Without
   * this case a regression reporting `isLoading` for an empty list would show
   * a permanent spinner and the rest of the suite would stay green.
   */
  it('renders the table with an add-your-first-job empty state when no jobs exist', () => {
    renderJobsPage({
      jobs: [],
    });

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();
    expect(screen.getByText('No saved jobs yet')).toBeInTheDocument();
    expect(
      screen.getByText('Add your first opportunity to start tracking applications.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // From `sm` up the header carries Add Job, so the empty state leaves it out.
    expect(screen.queryByRole('button', { name: 'Add Job' })).not.toBeInTheDocument();
  });

  it('opens the add job route from the first-run empty state on phones', async () => {
    const restoreViewport = mockPhoneViewport();
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs',
          element: <JobsPage error={null} isLoading={false} jobs={[]} onRetry={() => {}} />,
        },
        {
          path: '/jobs/new',
          element: <p>Add job route</p>,
        },
      ],
      {
        initialEntries: ['/jobs'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await user.click(screen.getByRole('button', { name: 'Add Job' }));

    expect(await screen.findByText('Add job route')).toBeInTheDocument();
    restoreViewport();
  });

  it('keeps the filter-oriented empty state when a search excludes every job', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    await user.type(screen.getByLabelText('Search'), 'nothing matches this');

    expect(screen.getByText('No jobs found')).toBeInTheDocument();
    expect(screen.queryByText('No saved jobs yet')).not.toBeInTheDocument();
  });

  it('renders the error state with the failure message when loading fails', () => {
    renderJobsPage({
      error: loadError(),
      jobs: [],
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Saved jobs could not be loaded');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load jobs');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('retries the load from the error state', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    renderJobsPage({
      error: loadError(),
      jobs: [],
      onRetry: handleRetry,
    });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('prefers the loading state over an error from a previous attempt', () => {
    renderJobsPage({
      error: loadError(),
      isLoading: true,
      jobs: [],
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('defaults to the table view', () => {
    renderJobsPage();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the view switch a named group of pressed-state buttons, showing the same jobs', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    const viewSwitch = screen.getByRole('group', { name: 'Jobs view' });
    const companies = ['Celonis', 'Personio', 'Miro'];

    companies.forEach((company) =>
      expect(within(screen.getByRole('table')).getByText(company)).toBeInTheDocument(),
    );

    await user.click(within(viewSwitch).getByRole('button', { name: 'Pipeline' }));

    // The board renders its own header, so the switch is found again.
    const boardSwitch = screen.getByRole('group', { name: 'Jobs view' });

    expect(within(boardSwitch).getByRole('button', { name: 'Pipeline' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(boardSwitch).getByRole('button', { name: 'Table' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    companies.forEach((company) =>
      expect(screen.getByRole('link', { name: `View details for ${company}` })).toBeInTheDocument(),
    );
  });

  it('switches to the Kanban pipeline view and back', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Interview' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Table' }));

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders every status column in the Kanban view, including empty ones', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].forEach((status) => {
      expect(screen.getByRole('region', { name: status })).toBeInTheDocument();
    });
  });

  it('links a Kanban card to the correct job detail page', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs',
          element: (
            <JobsPage error={null} isLoading={false} jobs={createMockJobs()} onRetry={() => {}} />
          ),
        },
        {
          path: '/jobs/:jobId',
          element: <p>Job detail route</p>,
        },
      ],
      {
        initialEntries: ['/jobs'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));
    await user.click(screen.getByRole('link', { name: 'View details for Personio' }));

    expect(await screen.findByText('Job detail route')).toBeInTheDocument();
  });

  it('moves a job to another status from its board card, and announces it', async () => {
    const user = userEvent.setup();
    server.use(
      http.put('/api/jobs/:jobId', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(createMockJobResponse({ ...body, id: String(params.jobId) }));
      }),
    );
    renderJobsPage();

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    const personioCard = within(screen.getByRole('region', { name: 'Applied' }))
      .getByRole('link', { name: 'View details for Personio' })
      .closest('article') as HTMLElement;

    await user.click(
      within(personioCard).getByRole('button', { name: 'Applied, change status for Personio' }),
    );
    await user.click(within(personioCard).getByRole('button', { name: 'Offer' }));

    const offerColumn = screen.getByRole('region', { name: 'Offer' });

    expect(
      within(offerColumn).getByRole('link', { name: 'View details for Personio' }),
    ).toBeInTheDocument();
    expect(
      within(offerColumn).getByRole('button', { name: 'Offer, change status for Personio' }),
    ).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Moved Personio to Offer.');
  });

  it('puts the card back and explains when a move fails', async () => {
    const user = userEvent.setup();
    server.use(http.put('/api/jobs/:jobId', () => new HttpResponse(null, { status: 500 })));
    renderJobsPage();

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));
    await user.click(screen.getByRole('button', { name: 'Applied, change status for Personio' }));
    await user.click(screen.getByRole('button', { name: 'Offer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Personio could not be moved to Offer.',
    );
    expect(
      within(screen.getByRole('region', { name: 'Applied' })).getByRole('link', {
        name: 'View details for Personio',
      }),
    ).toBeInTheDocument();
  });

  it('keeps the search when switching to the board, hiding cards that do not match', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Celonis');
    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('Celonis');
    expect(screen.getByRole('link', { name: 'View details for Celonis' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'View details for Personio' }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Applied' })).getByText(
        'No matching jobs in this status',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('1 of 3 opportunities shown')).toBeInTheDocument();
    // The board groups by status, so it offers no status filter.
    expect(screen.queryByRole('combobox', { name: 'Status' })).not.toBeInTheDocument();
  });

  it('orders the cards within each board column by the chosen sort', async () => {
    const user = userEvent.setup();
    renderJobsPage({
      jobs: [
        createMockJob({ company: 'Alpha', id: 'a', status: 'APPLIED' }),
        createMockJob({ company: 'Zeta', id: 'z', status: 'APPLIED' }),
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    const sortSelect = screen.getByRole('combobox', { name: 'Sort by' });
    const companiesInApplied = () =>
      within(screen.getByRole('region', { name: 'Applied' }))
        .getAllByRole('link')
        .map((link) => link.getAttribute('aria-label'));

    await user.selectOptions(sortSelect, 'company:desc');
    expect(companiesInApplied()).toEqual(['View details for Zeta', 'View details for Alpha']);

    await user.selectOptions(sortSelect, 'company:asc');
    expect(companiesInApplied()).toEqual(['View details for Alpha', 'View details for Zeta']);
  });

  it('keeps a status sort chosen in the table selectable on the board', async () => {
    const user = userEvent.setup();
    renderJobsPage();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'status:asc');
    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    const boardSort = screen.getByRole('combobox', { name: 'Sort by' });

    expect(boardSort).toHaveValue('status:asc');
    await user.selectOptions(boardSort, '');
    expect(boardSort).toHaveValue('');
  });

  it('offers a retry when application dates cannot be loaded', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    renderJobsPage({
      statusHistory: {
        error: new AppError(
          'Failed to load status history',
          APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
        ),
        events: null,
        isLoading: false,
        reload,
      },
    });

    expect(screen.getByText(/Application dates could not be loaded/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads the status history after a saved move, so application dates follow it', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    server.use(
      http.put('/api/jobs/:jobId', async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(createMockJobResponse({ ...body, id: String(params.jobId) }));
      }),
    );
    renderJobsPage({ statusHistory: { error: null, events: [], isLoading: false, reload } });

    await user.click(screen.getByRole('button', { name: 'Pipeline' }));
    await user.click(screen.getByRole('button', { name: 'Applied, change status for Personio' }));
    await user.click(screen.getByRole('button', { name: 'Offer' }));

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
  });
});
