import { useState, type FC } from 'react';

import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  tileToneClasses,
} from '../../components/ui';
import { SavedSearchEditor } from '../../features/discover/components/SavedSearchEditor';
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from '../../components/icons';
import {
  createEmptySavedSearchCriteria,
  type TSavedSearchCriteria,
  type TSavedSearchResponse,
} from '../../services';
import type { ISavedSearchesState } from '../../features/discover/useSavedSearches';
import { useTranslation } from '../../i18n';
import {
  SENIORITY_TRANSLATION_KEYS,
  WORK_MODE_TRANSLATION_KEYS,
} from '../../features/profile/preferences.constants';

/**
 * Props used by the Discover page: the saved searches state its route loads.
 */
type TDiscoverPageProps = ISavedSearchesState;

/**
 * Which editor is open: none, a new search, or an existing one.
 */
type TEditorTarget = { kind: 'closed' } | { kind: 'new' } | { kind: 'existing'; searchId: string };

/**
 * Tints for the saved search icons, used in turn down the list; the
 * dashboard's lavender, mint, and peach tiles.
 */
const SEARCH_ICON_TONES = [tileToneClasses.lavender, tileToneClasses.mint, tileToneClasses.peach];

/**
 * Props used by one saved search row.
 */
interface ISavedSearchRowProps {
  index: number;
  isDisabled: boolean;
  onDelete: (search: TSavedSearchResponse) => void;
  onEdit: (search: TSavedSearchResponse) => void;
  search: TSavedSearchResponse;
}

/**
 * Shows one saved search's name, role and location, and the criteria it
 * narrows by, with Edit and Delete.
 *
 * @param {ISavedSearchRowProps} props Component props.
 * @returns {JSX.Element} Saved search row.
 */
const SavedSearchRow: FC<ISavedSearchRowProps> = ({
  index,
  isDisabled,
  onDelete,
  onEdit,
  search,
}) => {
  const { t } = useTranslation();
  const { location, name, notes, role, seniority, skills, workModes } = search.criteria;
  const roleAndLocation = [role, location].filter(Boolean).join(' · ');
  const details = [
    ...seniority.map((level) => t(SENIORITY_TRANSLATION_KEYS[level] ?? level)),
    ...workModes.map((mode) => t(WORK_MODE_TRANSLATION_KEYS[mode] ?? mode)),
  ];

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${SEARCH_ICON_TONES[index % SEARCH_ICON_TONES.length]}`}
        >
          <SearchIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold text-app-text">{name}</h3>
          <p className="break-words text-sm text-app-textMuted">
            {roleAndLocation || t('discover.list.anyRoleOrLocation')}
          </p>
          {details.length > 0 && (
            <p className="mt-1 text-sm text-app-textSoft">{details.join(' · ')}</p>
          )}
          {skills.length > 0 && (
            <ul
              aria-label={t('discover.list.skillsLabel', { name })}
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {skills.map((skill) => (
                <li
                  className="rounded-full bg-app-surface2 px-2.5 py-0.5 text-xs font-medium text-app-textSoft ring-1 ring-inset ring-app-borderSoft"
                  key={skill}
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
          {notes && <p className="mt-2 break-words text-sm text-app-textMuted">{notes}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-1 pl-13 sm:pl-0">
        <Button
          aria-label={t('discover.list.editLabel', { name })}
          disabled={isDisabled}
          leftIcon={<EditIcon />}
          onClick={() => onEdit(search)}
          size="sm"
          variant="ghost"
        >
          {t('discover.list.edit')}
        </Button>
        <Button
          aria-label={t('discover.list.deleteLabel', { name })}
          className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"
          disabled={isDisabled}
          leftIcon={<TrashIcon />}
          onClick={() => onDelete(search)}
          size="sm"
          variant="ghost"
        >
          {t('discover.list.delete')}
        </Button>
      </div>
    </li>
  );
};

/**
 * The Discover page's saved searches: reusable job search criteria, saved
 * under a name, ready for later import and discovery flows, as one card of
 * rows. Nothing here runs a search or calls a provider. The editor takes
 * the card's place while open.
 *
 * @param {TDiscoverPageProps} props Component props.
 * @returns {JSX.Element} Discover page.
 */
export const DiscoverPage: FC<TDiscoverPageProps> = ({
  clearMutationError,
  createSearch,
  deleteSearch,
  isLoading,
  isMutating,
  loadError,
  mutationError,
  reload,
  searches,
  updateSearch,
}) => {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<TEditorTarget>({ kind: 'closed' });

  const switchEditor = (target: TEditorTarget) => {
    clearMutationError();
    setEditor(target);
  };

  if (editor.kind !== 'closed') {
    const existing =
      editor.kind === 'existing'
        ? searches.find((search) => search.id === editor.searchId)
        : undefined;

    const handleSave = async (criteria: TSavedSearchCriteria) => {
      if (existing) await updateSearch(existing.id, { criteria });
      else await createSearch({ criteria });

      switchEditor({ kind: 'closed' });
    };

    return (
      <SavedSearchEditor
        error={mutationError}
        initialCriteria={existing?.criteria ?? createEmptySavedSearchCriteria()}
        isSaving={isMutating}
        key={existing?.id ?? 'new'}
        onCancel={() => switchEditor({ kind: 'closed' })}
        onSave={handleSave}
        title={existing ? t('discover.editor.editTitle') : t('discover.editor.newTitle')}
      />
    );
  }

  const handleDelete = (search: TSavedSearchResponse) => {
    deleteSearch(search.id).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  };

  const renderBody = () => {
    if (isLoading) return <LoadingState label={t('discover.loading')} />;

    if (loadError)
      return (
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('discover.loadErrorTitle')}
        />
      );

    if (searches.length === 0)
      return (
        <EmptyState
          description={t('discover.list.emptyDescription')}
          icon={<SearchIcon className="h-5 w-5" />}
          title={t('discover.list.emptyTitle')}
        />
      );

    return (
      <ul className="divide-y divide-app-borderSoft">
        {searches.map((search, index) => (
          <SavedSearchRow
            index={index}
            isDisabled={isMutating}
            key={search.id}
            onDelete={handleDelete}
            onEdit={(selected) => switchEditor({ kind: 'existing', searchId: selected.id })}
            search={search}
          />
        ))}
      </ul>
    );
  };

  return (
    <Card
      action={
        !isLoading &&
        !loadError && (
          <Button
            className="shrink-0"
            disabled={isMutating}
            leftIcon={<PlusIcon />}
            onClick={() => switchEditor({ kind: 'new' })}
            size="sm"
            variant="secondary"
          >
            {t('discover.list.newSearch')}
          </Button>
        )
      }
      padding="none"
      subtitle={t('discover.list.subtitle')}
      title={t('discover.list.title')}
      titleId="saved-searches-heading"
    >
      {mutationError && (
        <div className="px-5 pt-4">
          <Alert>{mutationError.message}</Alert>
        </div>
      )}
      {renderBody()}
    </Card>
  );
};
