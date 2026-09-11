import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { http, HttpResponse } from 'msw';

import { useJobsList } from './useJobsList';
import { createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';

const JobsListProbe = () => {
  const { error, isLoading, jobs } = useJobsList();

  if (isLoading) return <p>loading</p>;

  if (error) return <p>error: {error.message}</p>;

  return (
    <ul>
      {jobs.map((job) => (
        <li key={job.id}>
          {job.company} description={String(job.description)}
        </li>
      ))}
    </ul>
  );
};

/** Lets a test hold the response open so the loading state can be observed. */
const createDeferredJobsHandler = () => {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });

  server.use(
    http.get('/api/jobs', async () => {
      await released;

      return HttpResponse.json([createMockJobResponse({ company: 'Celonis' })]);
    }),
  );

  return { release };
};

describe('useJobsList', () => {
  it('loads jobs from the API and maps them to the UI model', async () => {
    server.use(
      http.get('/api/jobs', () =>
        HttpResponse.json([
          createMockJobResponse({
            company: 'Celonis',
            description: null,
          }),
        ]),
      ),
    );
    render(<JobsListProbe />);

    // `description: null` on the wire has to arrive as `undefined`, which
    // proves the mapper is in the path rather than the raw response.
    expect(
      await screen.findByText('Celonis description=undefined', {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  /**
   * Holds the response open and then releases it, so the assertion sees
   * loading give way to data. Asserting only the first frame would pass even
   * if the hook never issued a request, because `idle` is reported as
   * loading.
   */
  it('reports loading until the response arrives, then renders the jobs', async () => {
    const { release } = createDeferredJobsHandler();
    render(<JobsListProbe />);

    expect(screen.getByText('loading')).toBeInTheDocument();

    release();

    expect(await screen.findByText(/Celonis/)).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('records the error and keeps the list empty when the request fails', async () => {
    server.use(http.get('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    render(<JobsListProbe />);

    expect(await screen.findByText(/^error:/)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('falls back to an empty list when the response is not an array', async () => {
    server.use(http.get('/api/jobs', () => HttpResponse.json({ content: [], page: 0 })));
    render(<JobsListProbe />);

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.queryByText(/^error:/)).not.toBeInTheDocument();
  });

  /**
   * An unstable effect dependency would refetch on every render. `waitFor`
   * resolves on its first synchronous pass, so it can only wait for a count
   * to be reached and never sees a later request; the settle step is what
   * gives the second assertion teeth.
   */
  it('requests the list once per mount', async () => {
    const requested = vi.fn();
    server.use(
      http.get('/api/jobs', () => {
        requested();

        return HttpResponse.json([]);
      }),
    );
    const { rerender } = render(<JobsListProbe />);

    await waitFor(() => expect(requested).toHaveBeenCalledTimes(1));

    rerender(<JobsListProbe />);
    await act(async () => {});

    expect(requested).toHaveBeenCalledTimes(1);
  });

  /**
   * StrictMode mounts, unmounts and remounts in development, so two requests
   * per page load is the real behaviour rather than a loop. Pinned here so a
   * future change to the effect is judged against what the app actually does.
   */
  it('issues one request per StrictMode mount cycle', async () => {
    const requested = vi.fn();
    server.use(
      http.get('/api/jobs', () => {
        requested();

        return HttpResponse.json([]);
      }),
    );
    render(
      <StrictMode>
        <JobsListProbe />
      </StrictMode>,
    );

    await waitFor(() => expect(requested).toHaveBeenCalledTimes(2));
    await act(async () => {});

    expect(requested).toHaveBeenCalledTimes(2);
  });
});
