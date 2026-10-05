import { useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, ErrorState, LoadingState } from '../../../components/ui';
import { CheckboxGroup } from './CheckboxGroup';
import { TagListEditor } from './TagListEditor';
import { createEmptyProfilePreferences, type TProfilePreferences } from '../../../services';
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

  const handleSubmit = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await onSave(draft);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {saveError && <Alert>{saveError.message}</Alert>}
      <TagListEditor
        disabled={isSaving}
        label={t('preferences.skills')}
        onChange={(skills) => setDraft({ ...draft, skills })}
        values={draft.skills}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TagListEditor
          disabled={isSaving}
          label={t('preferences.roles')}
          onChange={(roles) => setDraft({ ...draft, roles })}
          values={draft.roles}
        />
        <TagListEditor
          disabled={isSaving}
          label={t('preferences.locations')}
          onChange={(locations) => setDraft({ ...draft, locations })}
          values={draft.locations}
        />
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
      <TagListEditor
        disabled={isSaving}
        label={t('preferences.keywords')}
        onChange={(keywords) => setDraft({ ...draft, keywords })}
        values={draft.keywords}
      />
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
