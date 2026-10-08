import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createResumeProfile,
  deleteResumeProfile,
  getResumeProfiles,
  updateResumeProfile,
  type TResumeProfileResponse,
  type TSaveResumeProfileRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/**
 * Resume profiles state returned by useResumeProfiles.
 *
 * Each write resolves once it is confirmed and rejects with the error
 * after recording it in `mutationError`, as the job detail hooks do.
 */
export interface IResumeProfilesState {
  clearMutationError: () => void;
  createProfile: (payload: TSaveResumeProfileRequest) => Promise<TResumeProfileResponse>;
  deleteProfile: (profileId: string) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  profiles: TResumeProfileResponse[];
  reload: () => void;
  updateProfile: (
    profileId: string,
    payload: TSaveResumeProfileRequest,
  ) => Promise<TResumeProfileResponse>;
}

/**
 * Loads every resume profile and offers create, update, and delete.
 *
 * The loaded list is copied into local state when a load settles, and a
 * confirmed write is applied to that list directly rather than by
 * reloading: the response is the saved profile, and a whole profile is
 * the only thing that changes. A load that a newer load has overtaken is
 * ignored: `useAsyncMutation` keeps it out of its own request state but
 * still resolves with it, so the hook counts its loads, as
 * `useJobContacts` does.
 *
 * @returns {IResumeProfilesState} Profiles, request state, and the writes.
 */
export const useResumeProfiles = (): IResumeProfilesState => {
  const {
    mutate: loadProfiles,
    request: { error: loadError, isIdle, isLoading },
  } = useAsyncMutation<void, TResumeProfileResponse[]>(getResumeProfiles);
  const [profiles, setProfiles] = useState<TResumeProfileResponse[]>([]);
  const [mutationError, setMutationError] = useState<AppError | null>(null);
  const [pendingWrites, setPendingWrites] = useState(0);
  const latestLoadIdRef = useRef(0);

  const reload = useCallback(() => {
    latestLoadIdRef.current += 1;
    const loadId = latestLoadIdRef.current;

    loadProfiles().then(
      (loaded) => {
        if (loadId === latestLoadIdRef.current) setProfiles(Array.isArray(loaded) ? loaded : []);
      },
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [loadProfiles]);

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

  const createProfile = useCallback(
    (payload: TSaveResumeProfileRequest) =>
      runWrite(
        () => createResumeProfile(payload),
        (created) =>
          setProfiles((current) => [
            ...current.filter((profile) => profile.id !== created.id),
            created,
          ]),
      ),
    [runWrite],
  );

  const updateProfile = useCallback(
    (profileId: string, payload: TSaveResumeProfileRequest) =>
      runWrite(
        () => updateResumeProfile(profileId, payload),
        (updated) =>
          setProfiles((current) =>
            current.map((profile) => (profile.id === updated.id ? updated : profile)),
          ),
      ),
    [runWrite],
  );

  const deleteProfile = useCallback(
    (profileId: string) =>
      runWrite(
        () => deleteResumeProfile(profileId),
        () => setProfiles((current) => current.filter((profile) => profile.id !== profileId)),
      ),
    [runWrite],
  );

  const clearMutationError = useCallback(() => setMutationError(null), []);

  return {
    clearMutationError,
    createProfile,
    deleteProfile,
    isLoading: isIdle || isLoading,
    isMutating: pendingWrites > 0,
    loadError,
    mutationError,
    profiles,
    reload,
    updateProfile,
  };
};
