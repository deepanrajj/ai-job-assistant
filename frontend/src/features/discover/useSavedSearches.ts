import { useCallback, useEffect, useState } from 'react';

import {
  createSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch,
  type TSavedSearchResponse,
  type TSaveSavedSearchRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/**
 * Resume searches state returned by useSavedSearches.
 *
 * Each write resolves once it is confirmed and rejects with the error
 * after recording it in `mutationError`, as the job detail hooks do.
 */
export interface ISavedSearchesState {
  clearMutationError: () => void;
  createSearch: (payload: TSaveSavedSearchRequest) => Promise<TSavedSearchResponse>;
  deleteSearch: (searchId: string) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  searches: TSavedSearchResponse[];
  reload: () => void;
  updateSearch: (
    searchId: string,
    payload: TSaveSavedSearchRequest,
  ) => Promise<TSavedSearchResponse>;
}

/**
 * Loads every saved search and offers create, update, and delete.
 *
 * The loaded list is copied into local state when a load settles, and a
 * confirmed write is applied to that list directly rather than by
 * reloading: the response is the saved search, and a whole search is
 * the only thing that changes. `useAsyncMutation` drops a load response
 * that a newer load has overtaken.
 *
 * @returns {ISavedSearchesState} Saved searches, request state, and the writes.
 */
export const useSavedSearches = (): ISavedSearchesState => {
  const {
    mutate: loadSearches,
    request: { error: loadError, isIdle, isLoading },
  } = useAsyncMutation<void, TSavedSearchResponse[]>(getSavedSearches);
  const [searches, setSearches] = useState<TSavedSearchResponse[]>([]);
  const [mutationError, setMutationError] = useState<AppError | null>(null);
  const [pendingWrites, setPendingWrites] = useState(0);

  const reload = useCallback(() => {
    loadSearches().then(
      (loaded) => setSearches(Array.isArray(loaded) ? loaded : []),
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [loadSearches]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Runs a write: tracks it as pending, clears or records the mutation
   * error, applies the confirmed result, and re-throws a failure.
   */
  const runWrite = useCallback(<T>(write: () => Promise<T>, apply: (result: T) => void) => {
    setPendingWrites((count) => count + 1);

    return write()
      .then(
        (result) => {
          setMutationError(null);
          apply(result);

          return result;
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      )
      .finally(() => setPendingWrites((count) => count - 1));
  }, []);

  const createSearch = useCallback(
    (payload: TSaveSavedSearchRequest) =>
      runWrite(
        () => createSavedSearch(payload),
        (created) =>
          setSearches((current) => [
            ...current.filter((search) => search.id !== created.id),
            created,
          ]),
      ),
    [runWrite],
  );

  const updateSearch = useCallback(
    (searchId: string, payload: TSaveSavedSearchRequest) =>
      runWrite(
        () => updateSavedSearch(searchId, payload),
        (updated) =>
          setSearches((current) =>
            current.map((search) => (search.id === updated.id ? updated : search)),
          ),
      ),
    [runWrite],
  );

  const deleteSearch = useCallback(
    (searchId: string) =>
      runWrite(
        () => deleteSavedSearch(searchId),
        () => setSearches((current) => current.filter((search) => search.id !== searchId)),
      ),
    [runWrite],
  );

  const clearMutationError = useCallback(() => setMutationError(null), []);

  return {
    clearMutationError,
    createSearch,
    deleteSearch,
    isLoading: isIdle || isLoading,
    isMutating: pendingWrites > 0,
    loadError,
    mutationError,
    searches,
    reload,
    updateSearch,
  };
};
