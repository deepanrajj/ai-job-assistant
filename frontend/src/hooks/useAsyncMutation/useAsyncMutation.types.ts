import type { AppError } from '../../errors';

/**
 * Request status values managed by useAsyncMutation.
 */
export type TAsyncMutationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async function shape accepted by useAsyncMutation.
 */
export type TAsyncMutationFn<TArgs, TData> = (args: TArgs) => Promise<TData>;

/**
 * Function returned by useAsyncMutation to start the async action.
 */
export type TAsyncMutationTrigger<TArgs, TData> = (args: TArgs) => Promise<TData>;

/**
 * Derived request state returned by useAsyncMutation.
 */
export type TAsyncMutationResult<TData> = {
  data: TData | null;
  error: AppError | null;
  isError: boolean;
  isFetching: boolean;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  reset: () => void;
  setError: (error: AppError) => void;
  status: TAsyncMutationStatus;
};

/**
 * Object returned by useAsyncMutation with named mutation controls and request state.
 */
export type TUseAsyncMutationResult<TArgs, TData> = {
  mutate: TAsyncMutationTrigger<TArgs, TData>;
  request: TAsyncMutationResult<TData>;
};

/**
 * Internal state stored by useAsyncMutation before derived booleans are added.
 */
export interface IAsyncMutationState<TData> {
  data: TData | null;
  error: AppError | null;
  status: TAsyncMutationStatus;
}
