import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useMoveJobStatus } from './useMoveJobStatus';
import { createMockJob, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';

const job = createMockJob({ company: 'Celonis', id: 'job-1', status: 'APPLIED' });
// One stable list: a new array each render counts as fresh data and resets moves.
const loadedJobs = [job];

describe('useMoveJobStatus', () => {
  it('shows the new status at once and keeps the saved job, sending the other fields unchanged', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.put('/api/jobs/job-1', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json(
          createMockJobResponse({
            id: 'job-1',
            status: 'INTERVIEW',
            updatedAt: '2026-10-11T10:00:00Z',
          }),
        );
      }),
    );
    const { result } = renderHook(() => useMoveJobStatus(loadedJobs));

    act(() => {
      void result.current.moveJob(job, 'INTERVIEW');
    });

    expect(result.current.jobs[0].status).toBe('INTERVIEW');
    expect(result.current.lastMove).toEqual({
      company: 'Celonis',
      error: null,
      jobId: 'job-1',
      status: 'INTERVIEW',
    });
    await waitFor(() => expect(result.current.jobs[0].updatedAt).toBe('2026-10-11T10:00:00Z'));
    expect(body).toMatchObject({
      company: 'Celonis',
      roleTitle: job.roleTitle,
      status: 'INTERVIEW',
    });
  });

  it('restores the job and reports the failure when the request fails', async () => {
    server.use(http.put('/api/jobs/job-1', () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useMoveJobStatus(loadedJobs));

    await act(() => result.current.moveJob(job, 'OFFER'));

    expect(result.current.jobs[0].status).toBe('APPLIED');
    expect(result.current.lastMove?.error).not.toBeNull();
  });

  it('forgets moves when the loaded jobs change', () => {
    const { rerender, result } = renderHook(({ jobs }) => useMoveJobStatus(jobs), {
      initialProps: { jobs: [job] },
    });

    server.use(http.put('/api/jobs/job-1', () => new Promise(() => {})));
    act(() => {
      void result.current.moveJob(job, 'OFFER');
    });
    expect(result.current.jobs[0].status).toBe('OFFER');

    rerender({ jobs: [{ ...job, status: 'REJECTED' }] });
    expect(result.current.jobs[0].status).toBe('REJECTED');
  });
});
