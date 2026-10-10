import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createImportCandidate,
  deleteImportCandidate,
  getImportCandidates,
  updateImportCandidate,
  type TImportCandidateResponse,
  type TSaveImportCandidateRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/**
 * Resume candidates state returned by useImportCandidates.
 *
 * Each write resolves once it is confirmed and rejects with the error
 * after recording it in `mutationError`, as the job detail hooks do.
 */
export interface IImportCandidatesState {
  clearMutationError: () => void;
  createCandidate: (payload: TSaveImportCandidateRequest) => Promise<TImportCandidateResponse>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  candidates: TImportCandidateResponse[];
  reload: () => void;
  updateCandidate: (
    candidateId: string,
    payload: TSaveImportCandidateRequest,
  ) => Promise<TImportCandidateResponse>;
}

/**
 * Loads every import candidate and offers create, update, and delete.
 *
 * The loaded list is copied into local state when a load settles, and a
 * confirmed write is applied to that list directly rather than by
 * reloading: the response is the saved candidate, and a whole candidate is
 * the only thing that changes. `useAsyncMutation` drops a load response
 * that a newer load has overtaken.
 *
 * @returns {IImportCandidatesState} Candidates, request state, and the writes.
 */
export const useImportCandidates = (): IImportCandidatesState => {
  const {
    mutate: loadCandidates,
    request: { error: loadError, isIdle, isLoading },
  } = useAsyncMutation<void, TImportCandidateResponse[]>(getImportCandidates);
  const [candidates, setCandidates] = useState<TImportCandidateResponse[]>([]);
  const [mutationError, setMutationError] = useState<AppError | null>(null);
  const [pendingWrites, setPendingWrites] = useState(0);
  const writeVersion = useRef(0);
  const loadVersion = useRef(0);

  const reload = useCallback(() => {
    const startedAfterWrite = writeVersion.current;
    const currentLoad = ++loadVersion.current;

    loadCandidates().then(
      (loaded) => {
        if (startedAfterWrite === writeVersion.current && currentLoad === loadVersion.current)
          setCandidates(Array.isArray(loaded) ? loaded : []);
      },
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [loadCandidates]);

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
          writeVersion.current += 1;
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

  const createCandidate = useCallback(
    (payload: TSaveImportCandidateRequest) =>
      runWrite(
        () => createImportCandidate(payload),
        (created) =>
          setCandidates((current) => [
            ...current.filter((candidate) => candidate.id !== created.id),
            created,
          ]),
      ),
    [runWrite],
  );

  const updateCandidate = useCallback(
    (candidateId: string, payload: TSaveImportCandidateRequest) =>
      runWrite(
        () => updateImportCandidate(candidateId, payload),
        (updated) =>
          setCandidates((current) =>
            current.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
          ),
      ),
    [runWrite],
  );

  const deleteCandidate = useCallback(
    (candidateId: string) =>
      runWrite(
        () => deleteImportCandidate(candidateId),
        () =>
          setCandidates((current) => current.filter((candidate) => candidate.id !== candidateId)),
      ),
    [runWrite],
  );

  const clearMutationError = useCallback(() => setMutationError(null), []);

  return {
    clearMutationError,
    createCandidate,
    deleteCandidate,
    isLoading: isIdle || isLoading,
    isMutating: pendingWrites > 0,
    loadError,
    mutationError,
    candidates,
    reload,
    updateCandidate,
  };
};
