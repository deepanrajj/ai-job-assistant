import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { JobDetailPage } from './JobDetailPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import { APP_PATH_BUILDERS, APP_PATHS } from '../../routes/paths';
import type { IJobDetailPageActions } from '../../features/jobDetail/jobDetail.types';
import { mockJobDetails } from '../../data/mockJobDetails';

const JOBS_ROUTE_TEXT = 'Jobs route';
const EDIT_ROUTE_TEXT = 'Edit job route';

const renderJobDetailPage = (jobId = 'job-001', props: Partial<IJobDetailPageActions> = {}) =>
  renderWithProviders(
    <MemoryRouter initialEntries={[APP_PATH_BUILDERS.jobDetail(jobId)]}>
      <Routes>
        <Route
          element={<JobDetailPage jobId={jobId} jobs={mockJobDetails} {...props} />}
          path={APP_PATHS.JOB_DETAIL}
        />
        <Route element={<p>{JOBS_ROUTE_TEXT}</p>} path={APP_PATHS.JOBS} />
        <Route element={<p>{EDIT_ROUTE_TEXT}</p>} path={APP_PATHS.JOB_EDIT} />
      </Routes>
    </MemoryRouter>,
  );

describe('JobDetailPage', () => {
  it('renders the selected job overview from saved job data', async () => {
    const user = userEvent.setup();
    const onDeleteJob = vi.fn();
    const onStatusChange = vi.fn();
    renderJobDetailPage('job-001', {
      onDeleteJob,
      onStatusChange,
    });

    expect(screen.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeInTheDocument();
    expect(screen.getByText('Celonis')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toHaveClass(
      'cursor-pointer',
    );
    expect(screen.getByText('Preparation focus')).toBeInTheDocument();
    expect(screen.getAllByText('Prepare product analytics case study')).toHaveLength(2);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Job status' }), 'OFFER');
    expect(onStatusChange).toHaveBeenCalledWith('job-001', 'OFFER');

    expect(screen.getByRole('button', { name: 'Back to jobs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit job' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete job' })).toBeInTheDocument();
  });

  it('navigates back to the jobs route', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(screen.getByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('navigates to the edit route from the header action', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Edit job' }));

    expect(screen.getByText(EDIT_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('deletes the job and returns to the jobs route', async () => {
    const user = userEvent.setup();
    const onDeleteJob = vi.fn();
    renderJobDetailPage('job-001', {
      onDeleteJob,
    });

    await user.click(screen.getByRole('button', { name: 'Delete job' }));

    expect(onDeleteJob).toHaveBeenCalledWith('job-001');
    expect(screen.getByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('switches between job detail tabs', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByRole('tab', { name: 'Tasks', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preparation tasks' })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Tailor CV bullets for Senior Frontend Engineer' }),
    ).toBeChecked();

    await user.click(screen.getByRole('tab', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText(/Saved the role because Celonis/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByText('Job saved')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI' }));
    expect(screen.getByRole('heading', { name: 'Saved AI analysis' })).toBeInTheDocument();
    expect(screen.getByText(/Celonis is a strong match/)).toBeInTheDocument();
  });

  it('renders an error state when the job id is unknown', async () => {
    const user = userEvent.setup();
    renderJobDetailPage('missing-job');

    expect(screen.getByRole('alert')).toHaveTextContent('Job not found');
    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));
  });
});
