import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('useJobsList', () => {
  it('loads jobs from the API and maps them to the UI model', async () => {
    server.use(
      http.get('/api/jobs', () =>
        HttpResponse.json([
          createMockJobResponse({
            company: 'Celonis',
            description: null,
            id: 'job-001',
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

  it('reports loading before the response arrives', () => {
    render(<JobsListProbe />);

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('records the error and keeps the list empty when the request fails', async () => {
    server.use(http.get('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    render(<JobsListProbe />);

    expect(await screen.findByText(/^error:/)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  /**
   * A dependency whose identity changes every render would refetch forever,
   * and a test that only asserts the settled state cannot see that. This
   * counts the requests instead.
   */
  it('requests the list once on mount', async () => {
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

    await waitFor(() => expect(requested).toHaveBeenCalledTimes(1));
  });
});
