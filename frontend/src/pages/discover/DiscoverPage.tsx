import { useState, type FC } from 'react';

import { Alert, Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { SavedSearchEditor } from '../../features/discover/components/SavedSearchEditor';
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
 * Props used by one saved search card.
 */
interface ISavedSearchCardProps {
  isDisabled: boolean;
  onDelete: (search: TSavedSearchResponse) => void;
  onEdit: (search: TSavedSearchResponse) => void;
  search: TSavedSearchResponse;
}

/**
 * Shows one saved search's name, role and location, and the criteria it
 * narrows by, with Edit and Delete.
 *
 * @param {ISavedSearchCardProps} props Component props.
 * @returns {JSX.Element} Saved search card.
 */
const SavedSearchCard: FC<ISavedSearchCardProps> = ({ isDisabled, onDelete, onEdit, search }) => {
  const { t } = useTranslation();
  const { location, name, notes, role, seniority, skills, workModes } = search.criteria;
  const roleAndLocation = [role, location].filter(Boolean).join(' · ');
  const details = [
    ...seniority.map((level) => t(SENIORITY_TRANSLATION_KEYS[level])),
    ...workModes.map((mode) => t(WORK_MODE_TRANSLATION_KEYS[mode])),
  ];

  return (
    <li>
      <Card
        action={
          <div className="flex gap-2">
            <Button
              aria-label={t('discover.list.editLabel', { name })}
              disabled={isDisabled}
              onClick={() => onEdit(search)}
              size="sm"
            >
              {t('discover.list.edit')}
            </Button>
            <Button
              aria-label={t('discover.list.deleteLabel', { name })}
              disabled={isDisabled}
              onClick={() => onDelete(search)}
              size="sm"
              variant="danger"
            >
              {t('discover.list.delete')}
            </Button>
          </div>
        }
        subtitle={roleAndLocation || t('discover.list.anyRoleOrLocation')}
        title={name}
      >
        {details.length > 0 && <p className="text-sm text-app-textSoft">{details.join(' · ')}</p>}
        {skills.length > 0 && (
          <ul
            aria-label={t('discover.list.skillsLabel', { name })}
            className="mt-2 flex flex-wrap gap-2"
          >
            {skills.map((skill) => (
              <li
                className="rounded-full bg-app-surface2 px-3 py-1 text-sm text-app-text"
                key={skill}
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
        {notes && <p className="mt-2 text-sm text-app-textMuted">{notes}</p>}
      </Card>
    </li>
  );
};

/**
 * The Discover page: reusable job search criteria, saved under a name,
 * ready for later import and discovery flows. Nothing here runs a search
 * or calls a provider.
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

  if (isLoading) return <LoadingState label={t('discover.loading')} />;

  if (loadError)
    return (
      <ErrorState
        action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
        description={loadError.message}
        title={t('discover.loadErrorTitle')}
      />
    );

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

  return (
    <section aria-labelledby="saved-searches-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-app-text" id="saved-searches-heading">
            {t('discover.list.title')}
          </h2>
          <p className="text-sm text-app-textMuted">{t('discover.list.subtitle')}</p>
        </div>
        <Button disabled={isMutating} onClick={() => switchEditor({ kind: 'new' })}>
          {t('discover.list.newSearch')}
        </Button>
      </div>
      {mutationError && <Alert>{mutationError.message}</Alert>}
      {searches.length === 0 ? (
        <Card>
          <EmptyState
            description={t('discover.list.emptyDescription')}
            title={t('discover.list.emptyTitle')}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {searches.map((search) => (
            <SavedSearchCard
              isDisabled={isMutating}
              key={search.id}
              onDelete={handleDelete}
              onEdit={(selected) => switchEditor({ kind: 'existing', searchId: selected.id })}
              search={search}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
