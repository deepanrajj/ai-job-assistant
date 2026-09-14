import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';

import { useDeleteJob } from './useDeleteJob';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { server } from '../../test/server';

const DeleteJobProbe = () => {
  const { deleteJob, error, isDeleting } = useDeleteJob();
  const [done, setDone] = useState(false);

  return (
    <div>
      <button
        onClick={() => {
          deleteJob(MOCK_JOB_IDS.celonis)
            .then(() => setDone(true))
            .catch(() => undefined);
        }}
      >
        delete
      </button>
      <p>deleting={String(isDeleting)}</p>
      {done && <p>done</p>}
      {error && <p>error: {error.message}</p>}
    </div>
  );
};

const jobEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}`;

describe('useDeleteJob', () => {
  it('sends a delete to the job url and resolves on an empty 204', async () => {
    const user = userEvent.setup();
    let method = '';

    // 204 with no body is the contract here, so the resolved value carries
    // nothing. A guard like the one `useCreateJob` needs would reject this.
    server.use(
      http.delete(jobEndpoint, ({ request }) => {
        method = request.method;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(<DeleteJobProbe />);

    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(await screen.findByText('done')).toBeInTheDocument();
    expect(method).toBe('DELETE');
    expect(screen.queryByText(/^error:/)).not.toBeInTheDocument();
  });

  it('records a failed delete', async () => {
    const user = userEvent.setup();

    server.use(http.delete(jobEndpoint, () => new HttpResponse(null, { status: 500 })));
    render(<DeleteJobProbe />);

    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Failed to delete job');
    expect(screen.getByText('deleting=false')).toBeInTheDocument();
    expect(screen.queryByText('done')).not.toBeInTheDocument();
  });

  it('reports a 404 rather than deciding what an absent job means', async () => {
    const user = userEvent.setup();

    // Whether an already-absent job counts as success belongs to the caller.
    server.use(
      http.delete(jobEndpoint, () =>
        HttpResponse.json({ code: 'JOB_NOT_FOUND', message: 'Job not found.' }, { status: 404 }),
      ),
    );
    render(<DeleteJobProbe />);

    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Job not found.');
    expect(screen.queryByText('done')).not.toBeInTheDocument();
  });
});
