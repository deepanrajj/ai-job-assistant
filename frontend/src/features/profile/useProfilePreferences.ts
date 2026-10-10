import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getProfilePreferences,
  normalizeProfilePreferences,
  saveProfilePreferences,
  type TProfilePreferences,
  type TProfilePreferencesResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/**
 * Preferences state returned by useProfilePreferences.
 */
export interface IProfilePreferencesState {
  isLoading: boolean;
  isSaving: boolean;
  loadError: AppError | null;
  preferences: TProfilePreferencesResponse | null;
  reload: () => void;
  save: (preferences: TProfilePreferences) => Promise<void>;
  saveError: AppError | null;
}

/**
 * Loads the user's skills and job preferences and saves them back.
 * `save` normalizes the record first, so whatever reaches the API is
 * already clean; it rejects after recording `saveError` on failure.
 *
 * A load's result is applied only if no newer load or save started after
 * it was sent: `useAsyncMutation` keeps an overtaken response out of its
 * own request state but still resolves with it, and under `StrictMode` two
 * loads go out at mount, so a slow one could otherwise land after a save
 * and put the old record back on screen.
 *
 * @returns {IProfilePreferencesState} Preferences, request state, and save.
 */
export const useProfilePreferences = (): IProfilePreferencesState => {
  const {
    mutate: loadPreferences,
    request: { error: loadError, isIdle, isLoading },
  } = useAsyncMutation<void, TProfilePreferencesResponse>(getProfilePreferences);
  const {
    mutate: putPreferences,
    request: { error: saveError, isLoading: isSaving },
  } = useAsyncMutation<TProfilePreferences, TProfilePreferencesResponse>(saveProfilePreferences);
  const [preferences, setPreferences] = useState<TProfilePreferencesResponse | null>(null);
  const latestRequestIdRef = useRef(0);

  const reload = useCallback(() => {
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;

    loadPreferences().then(
      (loaded) => {
        if (requestId === latestRequestIdRef.current) setPreferences(loaded);
      },
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [loadPreferences]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    (next: TProfilePreferences) => {
      // Supersedes any load in flight; the saved record is the newest.
      latestRequestIdRef.current += 1;

      return putPreferences(normalizeProfilePreferences(next)).then((saved) => {
        setPreferences(saved);
      });
    },
    [putPreferences],
  );

  return {
    isLoading: (isIdle || isLoading) && !preferences,
    isSaving,
    loadError,
    preferences,
    reload,
    save,
    saveError,
  };
};
