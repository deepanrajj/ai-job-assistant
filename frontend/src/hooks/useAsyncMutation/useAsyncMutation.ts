import { useCallback, useMemo, useRef, useState } from 'react';

import { createInitialMutationState } from './useAsyncMutation.utils';
import type { AppError } from '../../errors';
import type {
  IAsyncMutationState,
  TAsyncMutationFn,
  TAsyncMutationResult,
  TAsyncMutationTrigger,
  TUseAsyncMutationResult,
} from './useAsyncMutation.types';

/**
 * Creates a small RTK Query-like mutation state wrapper for async actions.
 *
 * @param {TAsyncMutationFn<TArgs, TData>} mutationFn Async mutation function to run.
 * @returns {TUseAsyncMutationResult<TArgs, TData>} Named mutation function and derived request state.
 */
export const useAsyncMutation = <TArgs, TData>(
  mutationFn: TAsyncMutationFn<TArgs, TData>,
): TUseAsyncMutationResult<TArgs, TData> => {
  const requestIdRef = useRef(0);
  const [mutationState, setMutationState] = useState<IAsyncMutationState<TData>>(() =>
    createInitialMutationState<TData>(),
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setMutationState(createInitialMutationState<TData>());
  }, []);

  const setError = useCallback((error: AppError) => {
    requestIdRef.current += 1;
    setMutationState({
      data: null,
      error,
      status: 'error',
    });
  }, []);

  const mutate = useCallback<TAsyncMutationTrigger<TArgs, TData>>(
    (args) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setMutationState({
        data: null,
        error: null,
        status: 'loading',
      });

      return mutationFn(args).then(
        (data) => {
          if (requestId === requestIdRef.current)
            setMutationState({
              data,
              error: null,
              status: 'success',
            });

          return data;
        },
        (error: AppError) => {
          if (requestId === requestIdRef.current)
            setMutationState({
              data: null,
              error,
              status: 'error',
            });

          throw error;
        },
      );
    },
    [mutationFn],
  );

  const request = useMemo<TAsyncMutationResult<TData>>(
    () => ({
      ...mutationState,
      isError: mutationState.status === 'error',
      isFetching: mutationState.status === 'loading',
      isIdle: mutationState.status === 'idle',
      isLoading: mutationState.status === 'loading',
      isSuccess: mutationState.status === 'success',
      reset,
      setError,
    }),
    [mutationState, reset, setError],
  );

  return {
    mutate,
    request,
  };
};
