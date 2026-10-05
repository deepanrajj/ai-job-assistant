import { useCallback, useEffect, useState } from 'react';

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

  const reload = useCallback(() => {
    loadPreferences().then(setPreferences, () => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [loadPreferences]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    (next: TProfilePreferences) =>
      putPreferences(normalizeProfilePreferences(next)).then((saved) => {
        setPreferences(saved);
      }),
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
