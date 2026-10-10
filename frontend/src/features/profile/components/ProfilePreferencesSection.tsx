import { useRef, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, ErrorState, LoadingState } from '../../../components/ui';
import { CheckboxGroup } from './CheckboxGroup';
import { TagListEditor } from './TagListEditor';
import {
  createEmptyProfilePreferences,
  getPreferenceValueError,
  normalizePreferenceValue,
  type TProfilePreferences,
} from '../../../services';
import type { IProfilePreferencesState } from '../useProfilePreferences';
import { useTranslation } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';
import {
  SENIORITY_OPTIONS,
  SENIORITY_TRANSLATION_KEYS,
  WORK_MODE_OPTIONS,
  WORK_MODE_TRANSLATION_KEYS,
} from '../preferences.constants';

/**
 * The free-text lists, each edited with a `TagListEditor`.
 */
type TTagListKey = 'keywords' | 'locations' | 'roles' | 'skills';

const TAG_LIST_KEYS: readonly TTagListKey[] = ['skills', 'roles', 'locations', 'keywords'];

const EMPTY_PENDING: Record<TTagListKey, string> = {
  keywords: '',
  locations: '',
  roles: '',
  skills: '',
};

/**
 * Props used by the preferences form.
 */
interface IPreferencesFormProps {
  initial: TProfilePreferences;
  isSaving: boolean;
  onSave: (preferences: TProfilePreferences) => Promise<void>;
  saveError: IProfilePreferencesState['saveError'];
  updatedAt: string | null;
}

/**
 * Edits every preference at once and saves the whole record.
 *
 * @param {IPreferencesFormProps} props Component props.
 * @returns {JSX.Element} Preferences form.
 */
const PreferencesForm: FC<IPreferencesFormProps> = ({
  initial,
  isSaving,
  onSave,
  saveError,
  updatedAt,
}) => {
  const { language, t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const [pending, setPending] = useState(EMPTY_PENDING);
  const [syncedUpdatedAt, setSyncedUpdatedAt] = useState(updatedAt);
  const [hasSavedHere, setHasSavedHere] = useState(false);
  const inputRefs = useRef<Partial<Record<TTagListKey, HTMLInputElement | null>>>({});
  const isSubmittingRef = useRef(false);

  // A save returns a new record. The form takes it over in place rather
  // than remounting, so focus stays on Save and the status line below
  // changes text, which is what a screen reader announces.
  if (updatedAt !== syncedUpdatedAt) {
    setSyncedUpdatedAt(updatedAt);
    setDraft(initial);
    setPending(EMPTY_PENDING);
  }

  /**
   * Text typed into a list but not added would otherwise be left out of
   * the save, so Save adds it. If any of it cannot be added, focus moves to
   * the first such field, whose message says why, and nothing is saved.
   *
   * Save stays enabled while saving, so it keeps focus; the ref stops a
   * second submit in the same tick, before `isSaving` has rendered.
   */
  const handleSubmit = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving || isSubmittingRef.current) return;

    const blocked = TAG_LIST_KEYS.find((key) => getPreferenceValueError(draft[key], pending[key]));

    if (blocked) {
      inputRefs.current[blocked]?.focus();

      return;
    }

    const next = { ...draft };

    for (const key of TAG_LIST_KEYS)
      if (normalizePreferenceValue(pending[key]))
        next[key] = [...draft[key], normalizePreferenceValue(pending[key])];

    setDraft(next);
    setPending(EMPTY_PENDING);
    isSubmittingRef.current = true;

    try {
      await onSave(next);
      setHasSavedHere(true);
    } catch {
      // Error is already recorded in request state and rendered from it.
    } finally {
      isSubmittingRef.current = false;
    }
  };

  /**
   * The status line. It reads "Saving" during a save and "Preferences
   * saved" after one, so its text changes, and is announced, every time.
   *
   * @returns {string} Status text.
   */
  const getStatus = (): string => {
    if (isSaving) return t('preferences.saving');
    if (hasSavedHere) return t('preferences.saved');
    if (updatedAt) return t('preferences.savedOn', { date: formatJobDate(updatedAt, language) });

    return t('preferences.notSavedYet');
  };

  /**
   * The props that connect one free-text list to the form.
   *
   * @param {TTagListKey} key The list.
   * @returns {object} Values, pending text, and their change handlers.
   */
  const tagListProps = (key: TTagListKey) => ({
    disabled: isSaving,
    draft: pending[key],
    inputRef: (element: HTMLInputElement | null) => {
      inputRefs.current[key] = element;
    },
    onChange: (values: string[]) => setDraft({ ...draft, [key]: values }),
    onDraftChange: (text: string) => setPending({ ...pending, [key]: text }),
    values: draft[key],
  });

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {saveError && <Alert>{saveError.message}</Alert>}
      <TagListEditor label={t('preferences.skills')} {...tagListProps('skills')} />
      <div className="grid gap-6 md:grid-cols-2">
        <TagListEditor label={t('preferences.roles')} {...tagListProps('roles')} />
        <TagListEditor label={t('preferences.locations')} {...tagListProps('locations')} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <CheckboxGroup
          disabled={isSaving}
          label={(mode) => t(WORK_MODE_TRANSLATION_KEYS[mode])}
          legend={t('preferences.workModes')}
          onChange={(workModes) => setDraft({ ...draft, workModes })}
          options={WORK_MODE_OPTIONS}
          values={draft.workModes}
        />
        <CheckboxGroup
          disabled={isSaving}
          label={(level) => t(SENIORITY_TRANSLATION_KEYS[level])}
          legend={t('preferences.seniorityLabel')}
          onChange={(seniority) => setDraft({ ...draft, seniority })}
          options={SENIORITY_OPTIONS}
          values={draft.seniority}
        />
      </div>
      <TagListEditor label={t('preferences.keywords')} {...tagListProps('keywords')} />
      <div className="flex flex-wrap items-center gap-3">
        <Button aria-busy={isSaving} type="submit">
          {t('preferences.save')}
        </Button>
        <p className="text-sm text-app-textMuted" role="status">
          {getStatus()}
        </p>
      </div>
    </form>
  );
};

/**
 * The skills inventory and job preferences: skills, target roles,
 * locations, work modes, seniority, and keywords, saved as one record for
 * Discover and later AI matching to read.
 *
 * @param {IProfilePreferencesState} props Preferences state from the route.
 * @returns {JSX.Element} Preferences section.
 */
export const ProfilePreferencesSection: FC<IProfilePreferencesState> = ({
  isLoading,
  isSaving,
  loadError,
  preferences,
  reload,
  save,
  saveError,
}) => {
  const { t } = useTranslation();

  const renderBody = () => {
    if (isLoading) return <LoadingState label={t('preferences.loading')} />;

    if (loadError || !preferences)
      return (
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError?.message}
          title={t('preferences.loadErrorTitle')}
        />
      );

    const { updatedAt, ...initial } = preferences;

    return (
      <PreferencesForm
        initial={{ ...createEmptyProfilePreferences(), ...initial }}
        isSaving={isSaving}
        onSave={save}
        saveError={saveError}
        updatedAt={updatedAt}
      />
    );
  };

  return (
    <section aria-labelledby="profile-preferences-heading">
      <Card>
        <h2 className="text-lg font-semibold text-app-text" id="profile-preferences-heading">
          {t('preferences.title')}
        </h2>
        <p className="mb-6 text-sm text-app-textMuted">{t('preferences.subtitle')}</p>
        {renderBody()}
      </Card>
    </section>
  );
};
