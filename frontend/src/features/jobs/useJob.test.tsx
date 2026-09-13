import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { useJob } from './useJob';
import { MOCK_JOB_IDS, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';

interface IJobProbeProps {
  jobId?: string;
}

const JobProbe = ({ jobId = MOCK_JOB_IDS.celonis }: IJobProbeProps) => {
  const { error, isLoading, isNotFound, job, reload } = useJob(jobId);

  if (isLoading) return <p>loading</p>;

  if (isNotFound) return <p>not found</p>;

  if (error)
    return (
      <div>
        <p>error: {error.message}</p>
        <button onClick={reload} type="button">
          retry
        </button>
      </div>
    );

  return (
    <p>
      {job?.company} description={String(job?.description)} salaryMin={String(job?.salaryMin)}
    </p>
  );
};

const jobDetailEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}`;

describe('useJob', () => {
  it('loads the job for the route id and maps it to the UI model', async () => {
    server.use(
      http.get(jobDetailEndpoint, () =>
        HttpResponse.json(
          createMockJobResponse({
            company: 'Celonis',
            description: null,
            id: MOCK_JOB_IDS.celonis,
            salaryMin: null,
          }),
        ),
      ),
    );
    render(<JobProbe />);

    // A wire null has to arrive as `undefined` rather than as a value the
    // form would prefill: this is the shape the edit form round-trips.
    expect(await screen.findByText(/Celonis/)).toHaveTextContent(
      'Celonis description=undefined salaryMin=undefined',
    );
  });

  it('reports a missing job as not found rather than an error', async () => {
    server.use(
      http.get(jobDetailEndpoint, () =>
        HttpResponse.json({ code: 'JOB_NOT_FOUND', message: 'Job not found.' }, { status: 404 }),
      ),
    );
    render(<JobProbe />);

    expect(await screen.findByText('not found')).toBeInTheDocument();
  });

  it('reports an id that is not a uuid as not found', async () => {
    // The backend declares the path variable as a UUID, so a stale
    // localStorage id fails conversion and comes back as 400. Retrying it
    // can never succeed, so it is the same answer as a 404.
    server.use(
      http.get('/api/jobs/job-001', () =>
        HttpResponse.json(
          { code: 'INVALID_REQUEST_PARAMETER', message: 'Request parameter is invalid.' },
          { status: 400 },
        ),
      ),
    );
    render(<JobProbe jobId="job-001" />);

    expect(await screen.findByText('not found')).toBeInTheDocument();
  });

  it('reports a failed request as a retryable error', async () => {
    server.use(http.get(jobDetailEndpoint, () => new HttpResponse(null, { status: 500 })));
    render(<JobProbe />);

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Failed to load job');
  });

  it('reports a 2xx that carries no job as a failure', async () => {
    // `parseJsonResponse` resolves a 204 as undefined, so the request looks
    // successful while carrying nothing to render. Without a guard the probe
    // would show no job, no error and no loading state.
    server.use(http.get(jobDetailEndpoint, () => new HttpResponse(null, { status: 204 })));
    render(<JobProbe />);

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Failed to load job');
  });

  it('loads the new job when the route id changes', async () => {
    server.use(
      http.get(jobDetailEndpoint, () =>
        HttpResponse.json(createMockJobResponse({ company: 'Celonis' })),
      ),
      http.get(`/api/jobs/${MOCK_JOB_IDS.miro}`, () =>
        HttpResponse.json(createMockJobResponse({ company: 'Miro', id: MOCK_JOB_IDS.miro })),
      ),
    );
    const { rerender } = render(<JobProbe />);

    expect(await screen.findByText(/Celonis/)).toBeInTheDocument();

    rerender(<JobProbe jobId={MOCK_JOB_IDS.miro} />);

    expect(await screen.findByText(/Miro/)).toBeInTheDocument();
  });

  it('retries the same job when reload is called', async () => {
    const user = userEvent.setup();
    let attempt = 0;

    server.use(
      http.get(jobDetailEndpoint, () => {
        attempt += 1;

        return attempt === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(createMockJobResponse({ company: 'Celonis' }));
      }),
    );
    render(<JobProbe />);

    await user.click(await screen.findByRole('button', { name: 'retry' }));

    await waitFor(() => expect(screen.getByText(/Celonis/)).toBeInTheDocument());
    expect(attempt).toBe(2);
  });
});
