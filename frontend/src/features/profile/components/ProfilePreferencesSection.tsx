import { useEffect, useRef, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, ErrorState, LoadingState } from '../../../components/ui';
import { CheckboxGroup } from './CheckboxGroup';
import { TagListEditor } from './TagListEditor';
import { EditIcon } from '../../../components/icons';
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

/**
 * The two cards that edit the record, one at a time.
 */
type TPreferencesCard = 'preferences' | 'skills';

/**
 * The free-text lists each card edits, in form order.
 */
const CARD_TAG_LIST_KEYS: Record<TPreferencesCard, readonly TTagListKey[]> = {
  preferences: ['roles', 'locations', 'keywords'],
  skills: ['skills'],
};

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
  card: TPreferencesCard;
  initial: TProfilePreferences;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (preferences: TProfilePreferences) => Promise<void>;
  saveError: IProfilePreferencesState['saveError'];
}

/**
 * Edits the fields of one card and saves the whole record: those fields
 * over the stored values of the rest, since the endpoint replaces it.
 *
 * @param {IPreferencesFormProps} props Component props.
 * @returns {JSX.Element} Preferences form.
 */
const PreferencesForm: FC<IPreferencesFormProps> = ({
  card,
  initial,
  isSaving,
  onCancel,
  onSave,
  saveError,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const [pending, setPending] = useState(EMPTY_PENDING);
  const inputRefs = useRef<Partial<Record<TTagListKey, HTMLInputElement | null>>>({});
  const isSubmittingRef = useRef(false);
  const tagListKeys = CARD_TAG_LIST_KEYS[card];

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

    const blocked = tagListKeys.find((key) => getPreferenceValueError(draft[key], pending[key]));

    if (blocked) {
      inputRefs.current[blocked]?.focus();

      return;
    }

    const next = { ...draft };

    for (const key of tagListKeys)
      if (normalizePreferenceValue(pending[key]))
        next[key] = [...draft[key], normalizePreferenceValue(pending[key])];

    setDraft(next);
    setPending(EMPTY_PENDING);
    isSubmittingRef.current = true;

    try {
      await onSave(next);
    } catch {
      // Error is already recorded in request state and rendered from it.
    } finally {
      isSubmittingRef.current = false;
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
      {card === 'skills' ? (
        <TagListEditor label={t('preferences.skills')} {...tagListProps('skills')} />
      ) : (
        <>
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
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <Button aria-busy={isSaving} type="submit">
          {card === 'skills' ? t('preferences.saveSkills') : t('preferences.save')}
        </Button>
        <Button disabled={isSaving} onClick={onCancel} variant="ghost">
          {t('preferences.cancel')}
        </Button>
      </div>
    </form>
  );
};

/**
 * Props used by the read-only list of chips.
 */
interface IValueChipsProps {
  values: string[];
}

/**
 * Shows stored values as chips, or "None yet". Long values wrap.
 *
 * @param {IValueChipsProps} props Component props.
 * @returns {JSX.Element} Value chips.
 */
const ValueChips: FC<IValueChipsProps> = ({ values }) => {
  const { t } = useTranslation();

  if (values.length === 0)
    return <p className="text-sm text-app-textMuted">{t('preferences.noneYet')}</p>;

  return (
    <ul className="flex flex-wrap gap-2">
      {values.map((value) => (
        <li
          className="max-w-full break-words rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-800"
          key={value}
        >
          {value}
        </li>
      ))}
    </ul>
  );
};

/**
 * The skills inventory and job preferences, saved as one record for
 * Discover and later AI matching to read, as two cards: Skills, with the
 * skills as chips, and Job preferences, with target roles, locations,
 * work mode, seniority, and keywords. Each card has a view and an edit
 * mode, and only one card edits at a time: a save returns a new record,
 * which a second open editor would lose its unsaved edits to.
 *
 * Saving or cancelling returns focus to the card's edit button. The
 * status line under Job preferences stays mounted in both modes, so a
 * save from either card is announced.
 *
 * Loading and a load error show once, in one card. In the route's
 * two-column grid, Job preferences takes the full row (`col-span-full`,
 * which also fits a one-column grid).
 *
 * @param {IProfilePreferencesState} props Preferences state from the route.
 * @returns {JSX.Element} Skills and Job preferences cards.
 */
export const ProfilePreferencesSection: FC<IProfilePreferencesState> = ({
  clearSaveError,
  isLoading,
  isSaving,
  loadError,
  preferences,
  reload,
  save,
  saveError,
}) => {
  const { language, t } = useTranslation();
  const [editing, setEditing] = useState<TPreferencesCard | null>(null);
  // Whether the latest save from this section succeeded, so "Preferences
  // saved" is never shown after a later save failed.
  const [hasSavedHere, setHasSavedHere] = useState(false);
  const editButtonRefs = useRef<Partial<Record<TPreferencesCard, HTMLButtonElement | null>>>({});
  const focusAfterCloseRef = useRef<TPreferencesCard | null>(null);

  // The edit button renders again once its editor has closed, and is
  // enabled once no save is in flight, so it is focused after that render.
  useEffect(() => {
    const card = focusAfterCloseRef.current;
    const button = card === null ? null : editButtonRefs.current[card];

    if (editing !== null || !button || button.disabled) return;

    focusAfterCloseRef.current = null;

    // Only where focus fell to the page with the closed editor; focus the
    // user has since put elsewhere stays there.
    if (document.activeElement !== document.body && document.activeElement !== null) return;

    button.focus();
  }, [editing, isSaving]);

  if (isLoading || loadError || !preferences)
    return (
      <Card
        subtitle={t('preferences.subtitle')}
        title={t('preferences.title')}
        titleId="profile-preferences-heading"
      >
        {isLoading ? (
          <LoadingState label={t('preferences.loading')} />
        ) : (
          <ErrorState
            action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
            description={loadError?.message}
            title={t('preferences.loadErrorTitle')}
          />
        )}
      </Card>
    );

  const { updatedAt, ...stored } = preferences;
  const initial = { ...createEmptyProfilePreferences(), ...stored };

  // A save error belongs to the editor it happened in, so it is cleared
  // whenever an editor opens or closes.
  const open = (card: TPreferencesCard) => {
    clearSaveError();
    setEditing(card);
  };

  const close = (card: TPreferencesCard) => {
    clearSaveError();
    focusAfterCloseRef.current = card;
    setEditing(null);
  };

  const handleSave = (card: TPreferencesCard) => async (next: TProfilePreferences) => {
    setHasSavedHere(false);
    await save(next);
    setHasSavedHere(true);
    close(card);
  };

  /**
   * The status line. It reads "Saving" during a save and "Preferences
   * saved" after one that succeeded, so its text changes, and is
   * announced, every time. After a failed save it falls back to the
   * stored record's date.
   *
   * @returns {string} Status text.
   */
  const getStatus = (): string => {
    if (isSaving) return t('preferences.saving');
    if (hasSavedHere) return t('preferences.saved');
    if (updatedAt) return t('preferences.savedOn', { date: formatJobDate(updatedAt, language) });

    return t('preferences.notSavedYet');
  };

  const editButton = (card: TPreferencesCard, label: string) =>
    editing !== card && (
      <Button
        className="shrink-0"
        disabled={editing !== null || isSaving}
        leftIcon={<EditIcon />}
        onClick={() => open(card)}
        ref={(element) => {
          editButtonRefs.current[card] = element;
        }}
        size="sm"
        variant="ghost"
      >
        {label}
      </Button>
    );

  const form = (card: TPreferencesCard) => (
    <PreferencesForm
      card={card}
      initial={initial}
      isSaving={isSaving}
      onCancel={() => close(card)}
      onSave={handleSave(card)}
      saveError={saveError}
    />
  );

  const translated = (values: string[], keys: Record<string, string>): string[] =>
    values.map((value) => (Object.hasOwn(keys, value) ? t(keys[value] as string) : value));

  const summary: Array<{ label: string; values: string[] }> = [
    { label: t('preferences.roles'), values: initial.roles },
    { label: t('preferences.locations'), values: initial.locations },
    {
      label: t('preferences.workModes'),
      values: translated(initial.workModes, WORK_MODE_TRANSLATION_KEYS),
    },
    {
      label: t('preferences.seniorityLabel'),
      values: translated(initial.seniority, SENIORITY_TRANSLATION_KEYS),
    },
    { label: t('preferences.keywords'), values: initial.keywords },
  ];

  return (
    <>
      <Card
        action={editButton('skills', t('preferences.editSkills'))}
        className="min-w-0"
        subtitle={t('preferences.skillsSubtitle')}
        title={t('preferences.skills')}
        titleId="profile-skills-heading"
      >
        {editing === 'skills' ? form('skills') : <ValueChips values={initial.skills} />}
      </Card>
      <Card
        action={editButton('preferences', t('preferences.editPreferences'))}
        className="min-w-0 col-span-full"
        subtitle={t('preferences.jobSubtitle')}
        title={t('preferences.jobTitle')}
        titleId="profile-preferences-heading"
      >
        {editing === 'preferences' ? (
          form('preferences')
        ) : (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map(({ label, values }) => (
              <div className="min-w-0" key={label}>
                <dt className="text-xs font-medium text-app-textMuted">{label}</dt>
                <dd className="mt-1 break-words font-semibold text-app-text">
                  {values.length > 0 ? values.join(', ') : t('preferences.noneYet')}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-6 text-sm text-app-textMuted" role="status">
          {getStatus()}
        </p>
      </Card>
    </>
  );
};
