import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { EditJobPage } from './EditJobPage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { MOCK_JOB_IDS, createMockJob, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';
import { APP_ERROR_CODES, type TJob } from '../../types';

const JOBS_ROUTE_TEXT = 'Jobs route';

const mockJob = createMockJob({
  company: 'Celonis',
  id: MOCK_JOB_IDS.celonis,
  roleTitle: 'Senior Frontend Engineer',
  status: 'INTERVIEW',
});

const jobEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}`;

/**
 * Props used by the edit job page test renderer.
 */
interface IRenderEditJobPageOptions {
  error?: AppError | null;
  isLoading?: boolean;
  isNotFound?: boolean;
  job?: TJob | null;
  onRetry?: () => void;
}

const renderEditJobPage = ({
  error = null,
  isLoading = false,
  isNotFound = false,
  job = mockJob,
  onRetry = () => {},
}: IRenderEditJobPageOptions = {}) => {
  const router = createMemoryRouter(
    [
      {
        path: '/jobs/:jobId/edit',
        element: (
          <EditJobPage
            error={error}
            isLoading={isLoading}
            isNotFound={isNotFound}
            job={job}
            onRetry={onRetry}
          />
        ),
      },
      {
        path: '/jobs',
        element: <p>{JOBS_ROUTE_TEXT}</p>,
      },
    ],
    {
      initialEntries: [`/jobs/${MOCK_JOB_IDS.celonis}/edit`],
    },
  );

  return renderWithProviders(<RouterProvider router={router} />);
};

describe('EditJobPage', () => {
  it('prefills the form with the loaded job values', () => {
    renderEditJobPage();

    expect(screen.getByRole('heading', { name: 'Edit job' })).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('Celonis');
    expect(screen.getByLabelText('Role')).toHaveValue('Senior Frontend Engineer');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('INTERVIEW');
  });

  it('leaves the salary fields blank for a job that has no salary', () => {
    // The form round-trips what it prefills, so it has to be fed the job as
    // the API models it. The widened `TJobDetail` shape turns an absent
    // salary into a real 0, which would prefill "0" and save it back as a
    // salary the user never typed.
    renderEditJobPage({
      job: createMockJob({
        salaryMax: undefined,
        salaryMin: undefined,
      }),
    });

    // A number input with no value reads as null rather than as an empty
    // string; a widened job would make both of these 0.
    expect(screen.getByLabelText('Minimum salary')).toHaveValue(null);
    expect(screen.getByLabelText('Maximum salary')).toHaveValue(null);
  });

  it('saves the edited job through the API and returns to jobs', async () => {
    const user = userEvent.setup();
    let body: unknown;

    server.use(
      http.put(jobEndpoint, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(createMockJobResponse({ id: MOCK_JOB_IDS.celonis }));
      }),
    );
    renderEditJobPage();

    await user.clear(screen.getByLabelText('Company'));
    await user.type(screen.getByLabelText('Company'), 'Updated GmbH');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(body).toMatchObject({
        company: 'Updated GmbH',
        roleTitle: 'Senior Frontend Engineer',
        status: 'INTERVIEW',
      }),
    );
    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('keeps the entered values and announces the error when the save fails', async () => {
    const user = userEvent.setup();

    server.use(http.put(jobEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderEditJobPage();

    await user.clear(screen.getByLabelText('Company'));
    await user.type(screen.getByLabelText('Company'), 'Updated GmbH');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Job could not be saved');
    expect(alert).toHaveTextContent('Failed to update job');
    expect(screen.getByLabelText('Company')).toHaveValue('Updated GmbH');
    expect(screen.queryByText(JOBS_ROUTE_TEXT)).not.toBeInTheDocument();
  });

  it('says the job is gone and offers the way out when the save 404s', async () => {
    const user = userEvent.setup();

    // The job was deleted between loading this form and submitting it.
    // Retrying cannot succeed, so the error has to say so and lead somewhere.
    server.use(
      http.put(jobEndpoint, () =>
        HttpResponse.json({ code: 'JOB_NOT_FOUND', message: 'Job not found.' }, { status: 404 }),
      ),
    );
    renderEditJobPage();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Job not found');
    expect(alert).not.toHaveTextContent('Job could not be saved');
    // The values stay on screen; they are the user's to copy elsewhere.
    expect(screen.getByLabelText('Company')).toHaveValue('Celonis');

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('names the field the backend would reject, before sending it', async () => {
    const user = userEvent.setup();
    const putHandler = vi.fn(() => HttpResponse.json(createMockJobResponse()));

    // The backend caps salaries at 10 integer digits and short text at 255
    // characters. Without the same limits here the request goes out and comes
    // back as a 400 whose only readable message is "Request validation
    // failed", which names no field.
    server.use(http.put(jobEndpoint, putHandler));
    renderEditJobPage();

    await user.clear(screen.getByLabelText('Minimum salary'));
    await user.type(screen.getByLabelText('Minimum salary'), '99999999999');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText(
        'Enter a positive salary with at most 10 digits and 2 decimal places, or leave this empty.',
      ),
    ).toBeInTheDocument();
    expect(putHandler).not.toHaveBeenCalled();
  });

  it('reports a rejected field as a failed save, not as a missing job', async () => {
    const user = userEvent.setup();

    // The backend rejects an oversized field with 400, the same status a
    // malformed path id gets. Only the load path may read a 400 as "no such
    // job": a write carries a body, and this job exists.
    server.use(
      http.put(jobEndpoint, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_FAILED',
            message: 'Request validation failed.',
            fieldErrors: [
              { field: 'salaryMin', message: 'Minimum salary must have at most 10 digits' },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    renderEditJobPage();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Job could not be saved');
    expect(alert).not.toHaveTextContent('Job not found');
    // The way out is offered whatever the failure was: a 400 can name the
    // field in a part of the body this client does not read, so retrying is
    // not always something the user can act on.
    expect(screen.getByRole('button', { name: 'Back to jobs' })).toBeInTheDocument();
  });

  it('disables the submit button and announces the busy state while the save is in flight', async () => {
    const user = userEvent.setup();
    let release = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    server.use(
      http.put(jobEndpoint, async () => {
        await released;

        return HttpResponse.json(createMockJobResponse({ id: MOCK_JOB_IDS.celonis }));
      }),
    );
    renderEditJobPage();

    const submitButton = screen.getByRole('button', { name: 'Save changes' });

    await user.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
    expect(submitButton).toHaveAccessibleName('Saving...');

    release();

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('returns to jobs when the edit is cancelled', async () => {
    const user = userEvent.setup();
    renderEditJobPage();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
  });

  it('renders the loading state while the job is in flight', () => {
    renderEditJobPage({
      isLoading: true,
      job: null,
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading job');
    expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();
  });

  it('renders the not found state without offering a retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderEditJobPage({
      error: new AppError('Job not found.', APP_ERROR_CODES.JOB_REQUEST_FAILED, 404),
      isNotFound: true,
      job: null,
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Job not found');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(await screen.findByText(JOBS_ROUTE_TEXT)).toBeInTheDocument();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('renders the load error state with a working retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderEditJobPage({
      error: new AppError('Failed to load job', APP_ERROR_CODES.JOB_REQUEST_FAILED, 500),
      job: null,
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Job could not be loaded');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
