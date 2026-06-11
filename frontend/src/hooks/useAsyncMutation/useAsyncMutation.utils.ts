import type { IAsyncMutationState } from './useAsyncMutation.types';

/**
 * Creates the initial idle request state for useAsyncMutation.
 *
 * @returns {IAsyncMutationState<TData>} Empty idle mutation state.
 */
export const createInitialMutationState = <TData>(): IAsyncMutationState<TData> => ({
  data: null,
  error: null,
  status: 'idle',
});
