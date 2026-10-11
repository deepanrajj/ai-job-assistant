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

  it('sends moves of one job in order, each after the previous one settles', async () => {
    const sentStatuses: string[] = [];
    let releaseFirst: () => void = () => {};
    server.use(
      http.put('/api/jobs/job-1', async ({ request }) => {
        const body = (await request.json()) as { status: string };

        sentStatuses.push(body.status);
        if (body.status === 'INTERVIEW')
          await new Promise<void>((resolve) => {
            releaseFirst = resolve;
          });

        return HttpResponse.json(
          createMockJobResponse({ id: 'job-1', status: body.status as never }),
        );
      }),
    );
    const { result } = renderHook(() => useMoveJobStatus(loadedJobs));

    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.moveJob(job, 'INTERVIEW');
      second = result.current.moveJob({ ...job, status: 'INTERVIEW' }, 'OFFER');
    });

    await waitFor(() => expect(sentStatuses).toEqual(['INTERVIEW']));
    expect(result.current.jobs[0].status).toBe('OFFER');

    await act(async () => {
      releaseFirst();
      await first;
      await second;
    });

    expect(sentStatuses).toEqual(['INTERVIEW', 'OFFER']);
    expect(result.current.jobs[0].status).toBe('OFFER');
  });

  it('ignores a move that settles after the jobs reloaded', async () => {
    let release: (() => void) | undefined;
    server.use(
      http.put('/api/jobs/job-1', async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });

        return new HttpResponse(null, { status: 500 });
      }),
    );
    const { rerender, result } = renderHook(({ jobs }) => useMoveJobStatus(jobs), {
      initialProps: { jobs: loadedJobs },
    });

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.moveJob(job, 'OFFER');
    });
    const reloaded = [{ ...job, status: 'REJECTED' as const }];

    rerender({ jobs: reloaded });
    // Release only once the request is actually waiting.
    await waitFor(() => expect(release).toBeDefined());
    await act(async () => {
      release?.();
      await pending;
    });

    expect(result.current.jobs[0].status).toBe('REJECTED');
    expect(result.current.lastMove?.error ?? null).toBeNull();
  });

  it('records each saved move as a status-change event for the history', async () => {
    server.use(
      http.put('/api/jobs/job-1', () =>
        HttpResponse.json(
          createMockJobResponse({
            id: 'job-1',
            status: 'OFFER',
            updatedAt: '2026-10-11T10:00:00Z',
          }),
        ),
      ),
    );
    const { result } = renderHook(() => useMoveJobStatus(loadedJobs));

    await act(() => result.current.moveJob(job, 'OFFER'));

    expect(result.current.savedMoveEvents).toEqual([
      expect.objectContaining({
        createdAt: '2026-10-11T10:00:00Z',
        jobId: 'job-1',
        nextStatus: 'OFFER',
        previousStatus: 'APPLIED',
        type: 'STATUS_CHANGE',
      }),
    ]);
  });

  it('reports an earlier queued move that failed, while showing the later one', async () => {
    server.use(
      http.put('/api/jobs/job-1', async ({ request }) => {
        const body = (await request.json()) as { status: string };

        return body.status === 'INTERVIEW'
          ? new HttpResponse(null, { status: 409 })
          : HttpResponse.json(createMockJobResponse({ id: 'job-1', status: 'OFFER' }));
      }),
    );
    const { result } = renderHook(() => useMoveJobStatus(loadedJobs));

    await act(async () => {
      const first = result.current.moveJob(job, 'INTERVIEW');
      const second = result.current.moveJob({ ...job, status: 'INTERVIEW' }, 'OFFER');

      await first;
      await second;
    });

    expect(result.current.jobs[0].status).toBe('OFFER');
    expect(result.current.lastMove).toEqual(
      expect.objectContaining({ error: expect.anything(), status: 'INTERVIEW' }),
    );

    act(() => result.current.dismissLastMove());
    expect(result.current.lastMove).toBeNull();
  });
});
