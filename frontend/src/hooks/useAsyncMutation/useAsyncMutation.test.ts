import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useAsyncMutation } from './useAsyncMutation';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';

describe('useAsyncMutation', () => {
  it('tracks idle, loading, and success state', async () => {
    const mutationFn = vi.fn().mockResolvedValue('saved');
    const { result } = renderHook(() => useAsyncMutation<string, string>(mutationFn));

    expect(result.current.request.isIdle).toBe(true);

    await act(async () => {
      await expect(result.current.mutate('job-001')).resolves.toBe('saved');
    });

    expect(mutationFn).toHaveBeenCalledWith('job-001');
    expect(result.current.request).toMatchObject({
      data: 'saved',
      error: null,
      isSuccess: true,
      status: 'success',
    });
  });

  it('stores AppError values from failed mutations', async () => {
    const appError = new AppError('Failed to save', APP_ERROR_CODES.UNKNOWN);
    const { result } = renderHook(() =>
      useAsyncMutation<string, string>(vi.fn().mockRejectedValue(appError)),
    );

    await act(async () => {
      await expect(result.current.mutate('job-001')).rejects.toBe(appError);
    });

    expect(result.current.request).toMatchObject({
      data: null,
      error: appError,
      isError: true,
      status: 'error',
    });
  });

  it('supports manual error state and reset', () => {
    const appError = new AppError('Manual error', APP_ERROR_CODES.UNKNOWN);
    const { result } = renderHook(() => useAsyncMutation<string, string>(vi.fn()));

    act(() => {
      result.current.request.setError(appError);
    });

    expect(result.current.request.error).toBe(appError);
    expect(result.current.request.isError).toBe(true);

    act(() => {
      result.current.request.reset();
    });

    expect(result.current.request).toMatchObject({
      data: null,
      error: null,
      isIdle: true,
      status: 'idle',
    });
  });

  it('ignores stale successful mutations after a newer request finishes', async () => {
    let resolveFirstMutation: (value: string) => void = () => undefined;
    const mutationFn = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirstMutation = resolve;
          }),
      )
      .mockResolvedValueOnce('second result');
    const { result } = renderHook(() => useAsyncMutation<string, string>(mutationFn));

    let firstMutation: Promise<string>;

    act(() => {
      firstMutation = result.current.mutate('first');
    });

    await act(async () => {
      await expect(result.current.mutate('second')).resolves.toBe('second result');
    });

    await act(async () => {
      resolveFirstMutation('first result');
      await expect(firstMutation).resolves.toBe('first result');
    });

    expect(result.current.request).toMatchObject({
      data: 'second result',
      status: 'success',
    });
  });

  it('ignores stale failed mutations after reset', async () => {
    const staleError = new AppError('Stale failure', APP_ERROR_CODES.UNKNOWN);
    let rejectMutation: (error: AppError) => void = () => undefined;
    const mutationFn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((_resolve, reject) => {
          rejectMutation = reject;
        }),
    );
    const { result } = renderHook(() => useAsyncMutation<string, string>(mutationFn));

    let mutation: Promise<string>;

    act(() => {
      mutation = result.current.mutate('job-001');
    });

    act(() => {
      result.current.request.reset();
    });

    await act(async () => {
      rejectMutation(staleError);
      await expect(mutation).rejects.toBe(staleError);
    });

    expect(result.current.request).toMatchObject({
      error: null,
      isIdle: true,
      status: 'idle',
    });
  });
});
