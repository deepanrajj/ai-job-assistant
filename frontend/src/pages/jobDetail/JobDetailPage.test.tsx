import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { JobDetailPage } from './JobDetailPage';
import { mapJobToJobDetail } from '../../features/jobs/jobs.utils';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJob } from '../../test/mockJobs';
import { server } from '../../test/server';
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

const jobEndpoint = `/api/jobs/${mockJobDetail.id}`;

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

  it('deletes the job through the API and returns to jobs', async () => {
    const user = userEvent.setup();
    const deleteHandler = vi.fn(() => new HttpResponse(null, { status: 204 }));

    server.use(http.delete(jobEndpoint, deleteHandler));
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Delete job' }));

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
    expect(deleteHandler).toHaveBeenCalledTimes(1);
  });

  it('stays on the job and announces a failed delete', async () => {
    const user = userEvent.setup();

    server.use(http.delete(jobEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Delete job' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Job could not be deleted');
    expect(alert).toHaveTextContent('Failed to delete job');
    expect(screen.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeInTheDocument();
    expect(screen.queryByText(JOBS_ROUTE_TEXT)).not.toBeInTheDocument();
  });

  it('treats a delete that answers 404 as done', async () => {
    const user = userEvent.setup();

    // The job is already absent, which is what the user asked for. Reporting
    // a failure would offer a retry that cannot change the answer.
    server.use(
      http.delete(jobEndpoint, () =>
        HttpResponse.json({ code: 'JOB_NOT_FOUND', message: 'Job not found.' }, { status: 404 }),
      ),
    );
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Delete job' }));

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('Job could not be deleted')).not.toBeInTheDocument();
  });

  it('does not treat a 404 the API did not send as a completed delete', async () => {
    const user = userEvent.setup();

    // What a proxy or a routing change answers: a 404 with no error body in
    // the backend's shape. The request never reached the controller, so the
    // job is still there and leaving would report a delete that never
    // happened.
    server.use(http.delete(jobEndpoint, () => new HttpResponse('Not Found', { status: 404 })));
    renderJobDetailPage();

    await user.click(screen.getByRole('button', { name: 'Delete job' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Job could not be deleted');
    expect(screen.queryByText(JOBS_ROUTE_TEXT)).not.toBeInTheDocument();
  });

  it('sends one delete when two clicks land in the same tick', async () => {
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const deleteHandler = vi.fn(async () => {
      await released;

      return new HttpResponse(null, { status: 204 });
    });

    server.use(http.delete(jobEndpoint, deleteHandler));
    renderJobDetailPage();

    const deleteButton = screen.getByRole('button', { name: 'Delete job' });

    // Two deletes are not two of the same answer: the second answers 404,
    // and that is the state the hook would keep. The in-flight ref is what
    // stops it, and this case reports two calls without it.
    fireEvent.click(deleteButton);
    fireEvent.click(deleteButton);

    await waitFor(() => expect(deleteHandler).toHaveBeenCalled());
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    release();

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
    expect(deleteHandler).toHaveBeenCalledTimes(1);
  });

  it('reports the delete as busy while keeping the button focusable', async () => {
    const user = userEvent.setup();
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    server.use(
      http.delete(jobEndpoint, async () => {
        await released;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderJobDetailPage();

    const deleteButton = screen.getByRole('button', { name: 'Delete job' });

    await user.click(deleteButton);

    await waitFor(() => expect(deleteButton).toHaveAttribute('aria-busy', 'true'));

    // Disabling it would blur it, which costs a keyboard user their place
    // for the length of the request and after a failure.
    expect(deleteButton).toBeEnabled();
    expect(deleteButton).toHaveFocus();

    release();

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('offers no write it cannot complete', async () => {
    const user = userEvent.setup();
    renderJobDetailPage();

    // This wrote to the localStorage store by job id, which a backend id
    // never matches, so it would have looked like it worked. The tasks and
    // notes tabs, and the status select, are not one of these any more:
    // tasks 030, 031, and 035 each gave it a real backend-backed write
    // path, covered in its own test file.
    await user.click(screen.getByRole('tab', { name: 'AI' }));
    expect(screen.getByRole('button', { name: 'Analyze saved job' })).toBeDisabled();
  });

  it('changes the job status and shows it immediately', async () => {
    const user = userEvent.setup();
    let putBody: unknown;

    server.use(
      http.put(jobEndpoint, async ({ request }) => {
        putBody = await request.json();

        return new Promise(() => {});
      }),
    );
    renderJobDetailPage();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Job status' }), 'INTERVIEW');

    expect(screen.getByRole('combobox', { name: 'Job status' })).toHaveValue('INTERVIEW');
    await waitFor(() =>
      expect(putBody).toEqual(
        expect.objectContaining({
          status: 'INTERVIEW',
        }),
      ),
    );
  });

  it('reverts the job status and shows a failure when the change fails', async () => {
    const user = userEvent.setup();

    server.use(http.put(jobEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderJobDetailPage();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Job status' }), 'INTERVIEW');

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Job status could not be updated');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Job status' })).toHaveValue(
        mockJobDetail.status,
      ),
    );
  });
});
