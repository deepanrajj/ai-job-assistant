import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { JobsPage } from './JobsPage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { renderWithRouter } from '../../test/renderWithRouter';
import { createMockJobs } from '../../test/mockJobs';
import { APP_ERROR_CODES } from '../../types';

describe('JobsPage', () => {
  it('searches saved jobs by company name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobsPage error={null} isLoading={false} jobs={createMockJobs()} />);

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search'), 'personio');

    expect(screen.getByRole('rowheader', { name: /Personio/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Celonis/i })).not.toBeInTheDocument();
  });

  it('filters saved jobs by status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobsPage error={null} isLoading={false} jobs={createMockJobs()} />);

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
          element: <JobsPage error={null} isLoading={false} jobs={createMockJobs()} />,
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
    renderWithRouter(<JobsPage error={null} isLoading jobs={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading saved jobs');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the error state with the failure message when loading fails', () => {
    renderWithRouter(
      <JobsPage
        error={new AppError('Failed to load jobs', APP_ERROR_CODES.JOB_REQUEST_FAILED)}
        isLoading={false}
        jobs={[]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Saved jobs could not be loaded');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load jobs');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('prefers the loading state over an error from a previous attempt', () => {
    renderWithRouter(
      <JobsPage
        error={new AppError('Failed to load jobs', APP_ERROR_CODES.JOB_REQUEST_FAILED)}
        isLoading
        jobs={[]}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
