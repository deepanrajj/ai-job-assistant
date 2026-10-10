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

/** Applies one confirmed write to a candidate list. */
type TCandidateChange = (current: TImportCandidateResponse[]) => TImportCandidateResponse[];

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
 * Confirmed writes apply immediately. When a load was already in flight,
 * those writes are replayed over its response so older server rows and
 * newer local changes both remain visible. Older loads cannot replace a
 * newer load.
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
  const loadVersion = useRef(0);
  const loadIsPending = useRef(false);
  const changesDuringLoad = useRef<TCandidateChange[]>([]);

  const reload = useCallback(() => {
    const currentLoad = ++loadVersion.current;
    loadIsPending.current = true;
    changesDuringLoad.current = [];

    loadCandidates().then(
      (loaded) => {
        if (currentLoad !== loadVersion.current) return;

        loadIsPending.current = false;
        const changes = changesDuringLoad.current;
        changesDuringLoad.current = [];
        setCandidates(
          changes.reduce((rows, change) => change(rows), Array.isArray(loaded) ? loaded : []),
        );
      },
      () => {
        if (currentLoad === loadVersion.current) {
          loadIsPending.current = false;
          changesDuringLoad.current = [];
        }
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
  const runWrite = useCallback(
    <T>(write: () => Promise<T>, apply: (result: T) => TCandidateChange) => {
      setPendingWrites((count) => count + 1);

      return write()
        .then(
          (result) => {
            setMutationError(null);
            const change = apply(result);
            if (loadIsPending.current) changesDuringLoad.current.push(change);
            setCandidates(change);

            return result;
          },
          (error: AppError) => {
            setMutationError(error);
            throw error;
          },
        )
        .finally(() => setPendingWrites((count) => count - 1));
    },
    [],
  );

  const createCandidate = useCallback(
    (payload: TSaveImportCandidateRequest) =>
      runWrite(
        () => createImportCandidate(payload),
        (created) => (current) => [
          ...current.filter((candidate) => candidate.id !== created.id),
          created,
        ],
      ),
    [runWrite],
  );

  const updateCandidate = useCallback(
    (candidateId: string, payload: TSaveImportCandidateRequest) =>
      runWrite(
        () => updateImportCandidate(candidateId, payload),
        (updated) => (current) =>
          current.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
      ),
    [runWrite],
  );

  const deleteCandidate = useCallback(
    (candidateId: string) =>
      runWrite(
        () => deleteImportCandidate(candidateId),
        () => (current) => current.filter((candidate) => candidate.id !== candidateId),
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
