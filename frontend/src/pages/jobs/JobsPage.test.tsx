import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { JobsPage } from './JobsPage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { renderWithRouter } from '../../test/renderWithRouter';
import { createMockJobs } from '../../test/mockJobs';
import { APP_ERROR_CODES } from '../../types';

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

  it('navigates to the add job route from the table action', async () => {
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
    expect(screen.getByRole('button', { name: 'Add Job' })).toBeInTheDocument();
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
});
