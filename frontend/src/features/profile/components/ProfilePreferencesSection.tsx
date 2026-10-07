import { useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, ErrorState, LoadingState } from '../../../components/ui';
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
 * Props used by one checkbox group.
 */
interface ICheckboxGroupProps<T extends string> {
  disabled: boolean;
  label: (value: T) => string;
  legend: string;
  onChange: (values: T[]) => void;
  options: readonly T[];
  values: T[];
}

/**
 * A fieldset of checkboxes for a fixed set of choices.
 *
 * @param {ICheckboxGroupProps<T>} props Component props.
 * @returns {JSX.Element} Checkbox group.
 */
const CheckboxGroup = <T extends string>({
  disabled,
  label,
  legend,
  onChange,
  options,
  values,
}: ICheckboxGroupProps<T>) => (
  <fieldset>
    <legend className="mb-2 text-sm font-medium text-app-text">{legend}</legend>
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label className="inline-flex items-center gap-2 text-sm text-app-text" key={option}>
          <input
            checked={values.includes(option)}
            className="h-4 w-4 rounded border-app-border text-primary-600"
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [
                      ...options.filter(
                        (candidate) => candidate === option || values.includes(candidate),
                      ),
                      // A stored value this client does not offer is kept,
                      // not dropped by ticking another box.
                      ...values.filter((value) => !options.includes(value)),
                    ]
                  : values.filter((candidate) => candidate !== option),
              )
            }
            type="checkbox"
          />
          {label(option)}
        </label>
      ))}
    </div>
  </fieldset>
);

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

  /**
   * Text typed into a list but not added would otherwise be left out of
   * the save and then cleared by the remount that follows it, so Save adds
   * it. If any of it cannot be added, the field already says why, and
   * nothing is saved until it is fixed or cleared.
   */
  const handleSubmit = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (TAG_LIST_KEYS.some((key) => getPreferenceValueError(draft[key], pending[key]))) return;

    const next = { ...draft };

    for (const key of TAG_LIST_KEYS)
      if (normalizePreferenceValue(pending[key]))
        next[key] = [...draft[key], normalizePreferenceValue(pending[key])];

    setDraft(next);
    setPending(EMPTY_PENDING);

    try {
      await onSave(next);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
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
        <Button aria-busy={isSaving} disabled={isSaving} type="submit">
          {t('preferences.save')}
        </Button>
        <p className="text-sm text-app-textMuted" role="status">
          {updatedAt
            ? t('preferences.savedOn', { date: formatJobDate(updatedAt, language) })
            : t('preferences.notSavedYet')}
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
        key={updatedAt ?? 'unsaved'}
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
