import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { JobDetailPage } from './JobDetailPage';
import { mapJobToJobDetail } from '../../features/jobs/jobs.utils';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJob } from '../../test/mockJobs';
import { APP_PATH_BUILDERS, APP_PATHS } from '../../routes/paths';
import { APP_ERROR_CODES, type TJobDetail } from '../../types';

const JOBS_ROUTE_TEXT = 'Jobs route';
const EDIT_ROUTE_TEXT = 'Edit job route';

const mockJobDetail: TJobDetail = mapJobToJobDetail(
  createMockJob({
    company: 'Celonis',
    description: 'Own the design system and accessibility work.',
    id: '11111111-1111-4111-8111-111111111111',
    roleTitle: 'Senior Frontend Engineer',
  }),
);

/**
 * Props used by the job detail page test renderer.
 */
interface IRenderJobDetailPageOptions {
  error?: AppError | null;
  isLoading?: boolean;
  isNotFound?: boolean;
  job?: TJobDetail | null;
  onRetry?: () => void;
}

const renderJobDetailPage = ({
  error = null,
  isLoading = false,
  isNotFound = false,
  job = mockJobDetail,
  onRetry = () => {},
}: IRenderJobDetailPageOptions = {}) =>
  renderWithProviders(
    <MemoryRouter initialEntries={[APP_PATH_BUILDERS.jobDetail(mockJobDetail.id)]}>
      <Routes>
        <Route
          element={
            <JobDetailPage
              error={error}
              isLoading={isLoading}
              isNotFound={isNotFound}
              job={job}
              onRetry={onRetry}
            />
          }
          path={APP_PATHS.JOB_DETAIL}
        />
        <Route element={<p>{JOBS_ROUTE_TEXT}</p>} path={APP_PATHS.JOBS} />
        <Route element={<p>{EDIT_ROUTE_TEXT}</p>} path={APP_PATHS.JOB_EDIT} />
      </Routes>
    </MemoryRouter>,
  );

describe('JobDetailPage', () => {
  it('renders the loaded job overview and metadata', () => {
    renderJobDetailPage();

    expect(screen.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Celonis')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('EUR 70k - EUR 90k')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();
  });

  it('renders the loading state while the job is in flight', () => {
    renderJobDetailPage({
      isLoading: true,
      job: null,
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading job');
    expect(
      screen.queryByRole('heading', { name: 'Senior Frontend Engineer' }),
    ).not.toBeInTheDocument();
  });

  it('renders the not found state without offering a retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderJobDetailPage({
      error: new AppError('Job not found.', APP_ERROR_CODES.JOB_REQUEST_FAILED, 404),
      isNotFound: true,
      job: null,
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Job not found');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(screen.getByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('renders the load error state with a working retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderJobDetailPage({
      error: new AppError('Failed to load job', APP_ERROR_CODES.JOB_REQUEST_FAILED, 500),
      job: null,
      onRetry,
    });

    const alert = screen.getByRole('alert');

    expect(alert).toHaveTextContent('Job could not be loaded');
    expect(alert).toHaveTextContent('Failed to load job');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('navigates back to the jobs route from the loaded job', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(screen.getByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('switches between job detail tabs', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByRole('tab', { name: 'Tasks', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparation tasks' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI' }));
    expect(screen.getByRole('heading', { name: 'Saved AI analysis' })).toBeInTheDocument();
  });

  it('opens the edit route from the header action', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Edit job' }));

    expect(screen.getByText(EDIT_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('offers no write it cannot complete', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    // Every one of these wrote to the localStorage store by job id, which a
    // backend id never matches, so each would have looked like it worked.
    expect(screen.getByRole('combobox', { name: 'Job status' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Delete job' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(screen.queryByRole('button', { name: 'Add note' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.queryByRole('button', { name: 'Add task' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI' }));
    expect(screen.getByRole('button', { name: 'Analyze saved job' })).toBeDisabled();
  });
});
