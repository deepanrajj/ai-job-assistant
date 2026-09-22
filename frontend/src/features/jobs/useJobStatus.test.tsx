import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';

import { useJobStatus } from './useJobStatus';
import { mapJobToJobDetail } from './jobs.utils';
import { MOCK_JOB_IDS, createMockJob, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';
import type { TJobDetail, TJobStatus } from '../../types';

const mockJobDetail: TJobDetail = mapJobToJobDetail(
  createMockJob({
    company: 'Celonis',
    id: MOCK_JOB_IDS.celonis,
    status: 'APPLIED',
  }),
);

const JobStatusProbe = ({ job = mockJobDetail }: { job?: TJobDetail }) => {
  const [jobId, setJobId] = useState(job.id);
  const { changeStatus, error, isChanging, optimisticStatus } = useJobStatus(jobId);

  return (
    <div>
      <p>status={optimisticStatus ?? job.status}</p>
      <p>changing={String(isChanging)}</p>
      {error && <p>error: {error.message}</p>}
      <button
        onClick={() =>
          changeStatus(job, 'INTERVIEW').catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        change
      </button>
      <button
        onClick={() =>
          changeStatus(job, 'OFFER').catch(() => {
            // Error is already recorded in request state and rendered from it.
          })
        }
      >
        change-offer
      </button>
      <button onClick={() => setJobId('other-job-id')}>navigate</button>
      <p>jobId={jobId}</p>
    </div>
  );
};

const jobEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}`;

describe('useJobStatus', () => {
  it('shows the new status immediately, before the request resolves', async () => {
    const user = userEvent.setup();

    server.use(http.put(jobEndpoint, () => new Promise(() => {})));
    render(<JobStatusProbe />);

    await user.click(screen.getByRole('button', { name: 'change' }));

    expect(screen.getByText('status=INTERVIEW')).toBeInTheDocument();
  });

  it('sends every other editable field unchanged alongside the new status', async () => {
    const user = userEvent.setup();
    let body: unknown;

    server.use(
      http.put(jobEndpoint, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(createMockJobResponse({ id: MOCK_JOB_IDS.celonis }));
      }),
    );
    render(<JobStatusProbe />);

    await user.click(screen.getByRole('button', { name: 'change' }));

    expect(await screen.findByText('changing=false')).toBeInTheDocument();
    expect(body).toEqual({
      company: mockJobDetail.company,
      description: mockJobDetail.description,
      jobUrl: mockJobDetail.jobUrl,
      location: mockJobDetail.location,
      roleTitle: mockJobDetail.roleTitle,
      salaryMax: mockJobDetail.salaryMax,
      salaryMin: mockJobDetail.salaryMin,
      status: 'INTERVIEW',
    });
  });

  it('rolls back to the previous status on a failed change', async () => {
    const user = userEvent.setup();

    server.use(http.put(jobEndpoint, () => new HttpResponse(null, { status: 500 })));
    render(<JobStatusProbe />);

    await user.click(screen.getByRole('button', { name: 'change' }));

    expect(await screen.findByText(/^error:/)).toHaveTextContent('Failed to update job');
    expect(screen.getByText(`status=${mockJobDetail.status}`)).toBeInTheDocument();
  });

  it('rolls a second failed change back to the first, already-successful change', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    server.use(
      http.put(jobEndpoint, () => {
        callCount += 1;

        return callCount === 1
          ? HttpResponse.json(
              createMockJobResponse({ id: MOCK_JOB_IDS.celonis, status: 'INTERVIEW' }),
            )
          : HttpResponse.json({ message: 'boom' }, { status: 500 });
      }),
    );
    render(<JobStatusProbe />);

    // First change succeeds and is kept, with no reload to confirm it.
    await user.click(screen.getByRole('button', { name: 'change' }));
    await screen.findByText('changing=false');
    expect(screen.getByText('status=INTERVIEW')).toBeInTheDocument();

    // The second change (still to INTERVIEW, since the probe always sends
    // the same target status) fails; rolling back must land on the first
    // change's result, not the job's originally loaded status.
    await user.click(screen.getByRole('button', { name: 'change' }));

    expect(await screen.findByText(/^error:/)).toBeInTheDocument();
    expect(screen.getByText('status=INTERVIEW')).toBeInTheDocument();
  });

  it('ignores a stale rollback once a change started after it has already succeeded', async () => {
    const user = userEvent.setup();
    let releaseFirstRequest: () => void = () => {};
    const firstRequestReleased = new Promise<void>((resolve) => {
      releaseFirstRequest = resolve;
    });
    let firstRequestSettled = false;

    server.use(
      http.put(jobEndpoint, async ({ request }) => {
        const body = (await request.json()) as { status: TJobStatus };

        if (body.status === 'INTERVIEW') {
          // The first call started, but only resolves - as a failure -
          // once the test releases it, after the second call below has
          // already succeeded.
          await firstRequestReleased;
          firstRequestSettled = true;

          return HttpResponse.json({ message: 'boom' }, { status: 500 });
        }

        return HttpResponse.json(
          createMockJobResponse({ id: MOCK_JOB_IDS.celonis, status: 'OFFER' }),
        );
      }),
    );
    render(<JobStatusProbe />);

    // The select is never disabled while a change is in flight (Decision
    // 5), so a second, different change can start before the first one
    // resolves.
    await user.click(screen.getByRole('button', { name: 'change' }));
    await user.click(screen.getByRole('button', { name: 'change-offer' }));

    expect(await screen.findByText('status=OFFER')).toBeInTheDocument();

    releaseFirstRequest();

    // Waits for the first request to actually settle (as a failure)
    // before asserting - `useAsyncMutation`'s own request-id guard means
    // its rejection never even reaches `error`, so `optimisticStatus` is
    // the only thing left this test can check was protected.
    await waitFor(() => expect(firstRequestSettled).toBe(true));
    expect(screen.getByText('status=OFFER')).toBeInTheDocument();
  });

  it('resets the optimistic status when the job id changes', async () => {
    const user = userEvent.setup();

    server.use(http.put(jobEndpoint, () => new Promise(() => {})));
    render(<JobStatusProbe />);

    await user.click(screen.getByRole('button', { name: 'change' }));

    expect(screen.getByText('status=INTERVIEW')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'navigate' }));

    expect(screen.getByText(`status=${mockJobDetail.status}`)).toBeInTheDocument();
  });
});
