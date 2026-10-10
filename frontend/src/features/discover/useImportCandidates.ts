import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createImportCandidate,
  deleteImportCandidate,
  getImportCandidates,
  importCandidatesAsJobs,
  updateImportCandidate,
  type TImportCandidateResponse,
  type TImportCandidateResult,
  type TSaveImportCandidateRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/** Applies one confirmed write to a candidate list. */
type TCandidateChange = (current: TImportCandidateResponse[]) => TImportCandidateResponse[];

/**
 * Resume candidates state returned by useImportCandidates.
 *
 * Candidate edits record rejected writes in `mutationError`; imports
 * reject for the import controls to display the request error.
 */
export interface IImportCandidatesState {
  clearMutationError: () => void;
  /**
   * Imports the given candidates as jobs and resolves with each outcome.
   * Candidates reported imported are marked so in the list. Rejects only
   * when the request itself fails.
   */
  importCandidates: (candidateIds: string[]) => Promise<TImportCandidateResult[]>;
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
   * error for candidate edits, applies the confirmed result, and re-throws
   * a failure. Import errors are displayed by the import controls instead.
   */
  const runWrite = useCallback(
    <T>(
      write: () => Promise<T>,
      apply: (result: T) => TCandidateChange,
      recordMutationError = true,
    ) => {
      setPendingWrites((count) => count + 1);

      return write()
        .then(
          (result) => {
            if (recordMutationError) setMutationError(null);
            const change = apply(result);
            if (loadIsPending.current) changesDuringLoad.current.push(change);
            setCandidates(change);

            return result;
          },
          (error: AppError) => {
            if (recordMutationError) setMutationError(error);
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

  const importCandidates = useCallback(
    (candidateIds: string[]) =>
      runWrite(
        () => importCandidatesAsJobs(candidateIds).then((response) => response.results),
        (results) => {
          const imported = new Set(
            results
              .filter((result) => result.outcome === 'IMPORTED')
              .map((result) => result.candidateId),
          );

          return (current: TImportCandidateResponse[]) =>
            current.map((candidate) =>
              imported.has(candidate.id) ? { ...candidate, reviewStatus: 'IMPORTED' } : candidate,
            );
        },
        false,
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
    importCandidates,
    isLoading: isIdle || isLoading,
    isMutating: pendingWrites > 0,
    loadError,
    mutationError,
    candidates,
    reload,
    updateCandidate,
  };
};
