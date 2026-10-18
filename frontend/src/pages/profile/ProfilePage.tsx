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
import { ResumeProfileEditor } from '../../features/profile/components/ResumeProfileEditor';
import { DocumentIcon, EditIcon, PlusIcon, TrashIcon } from '../../components/icons';
import type { IResumeProfilesState } from '../../features/profile/useResumeProfiles';
import { useTranslation } from '../../i18n';
import { classNames } from '../../utils';
import { formatJobDate } from '../../features/jobs/jobs.utils';
import { createEmptyProfileContent } from '../../features/profile/profileEntries.utils';
import { RESUME_PROFILE_TARGET_ROLE_TRANSLATION_KEYS } from '../../features/profile/profile.constants';
import type { TResumeProfileContent, TResumeProfileResponse } from '../../services';

/**
 * Props used by the Profile page: the resume profiles state its route loads.
 */
type TProfilePageProps = IResumeProfilesState;

/**
 * Which editor is open: none, a new profile, or an existing one.
 */
type TEditorTarget = { kind: 'closed' } | { kind: 'new' } | { kind: 'existing'; profileId: string };

/**
 * Props used by one profile row.
 */
interface IResumeProfileRowProps {
  isDisabled: boolean;
  onDelete: (profile: TResumeProfileResponse) => void;
  onEdit: (profile: TResumeProfileResponse) => void;
  position: number;
  profile: TResumeProfileResponse;
}

/**
 * Tile tones for the rows' document icons, in turn by position.
 */
const PROFILE_ICON_TONES = [tileToneClasses.lavender, tileToneClasses.mint, tileToneClasses.peach];

/**
 * Shows one profile as a row: a document tile, the name, the target role
 * and when it was last updated, the summary, how many entries it has,
 * and Edit and Delete.
 *
 * @param {IResumeProfileRowProps} props Component props.
 * @returns {JSX.Element} Profile row.
 */
const ResumeProfileRow: FC<IResumeProfileRowProps> = ({
  isDisabled,
  onDelete,
  onEdit,
  position,
  profile,
}) => {
  const { language, t } = useTranslation();
  const { education, highlights, links, summary, targetRole } = profile.profile;

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          aria-hidden="true"
          className={classNames(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            PROFILE_ICON_TONES[position % PROFILE_ICON_TONES.length],
          )}
        >
          <DocumentIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold text-app-text">{profile.name}</h3>
          <p className="text-sm text-app-textMuted">
            {t(RESUME_PROFILE_TARGET_ROLE_TRANSLATION_KEYS[targetRole])} ·{' '}
            {t('profile.list.updated', { date: formatJobDate(profile.updatedAt, language) })}
          </p>
          {summary && (
            <p className="mt-1 line-clamp-2 break-words text-sm text-app-textSoft">{summary}</p>
          )}
          <p className="mt-1 text-xs text-app-textMuted">
            {t('profile.list.counts', {
              education: education.length,
              highlights: highlights.length,
              links: links.length,
            })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1 pl-13 sm:pl-0">
        <Button
          aria-label={t('profile.list.editLabel', { name: profile.name })}
          disabled={isDisabled}
          leftIcon={<EditIcon />}
          onClick={() => onEdit(profile)}
          size="sm"
          variant="ghost"
        >
          {t('profile.list.edit')}
        </Button>
        <Button
          aria-label={t('profile.list.deleteLabel', { name: profile.name })}
          disabled={isDisabled}
          leftIcon={<TrashIcon />}
          onClick={() => onDelete(profile)}
          size="sm"
          variant="dangerGhost"
        >
          {t('profile.list.delete')}
        </Button>
      </div>
    </li>
  );
};

/**
 * The Profile page's resume library: profiles aimed at different roles,
 * each with a summary, highlights, education, links, and notes, as one
 * card of rows with New profile in its header. Loading, error, and empty
 * states sit inside the card. The editor takes the card's place while
 * open; the route widens it to the full row then (`data-editor`).
 *
 * @param {TProfilePageProps} props Component props.
 * @returns {JSX.Element} Profile page.
 */
export const ProfilePage: FC<TProfilePageProps> = ({
  clearMutationError,
  createProfile,
  deleteProfile,
  isLoading,
  isMutating,
  loadError,
  mutationError,
  profiles,
  reload,
  updateProfile,
}) => {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<TEditorTarget>({ kind: 'closed' });

  /**
   * Opens or closes the editor. A write error belongs to the view it
   * happened in, so it is cleared on the way to the other one: a failed
   * delete must not greet a new profile, nor a cancelled save the list.
   */
  const switchEditor = (target: TEditorTarget) => {
    clearMutationError();
    setEditor(target);
  };

  // The editor needs the loaded list: while it reloads or failed to load,
  // the card shows that state, so an open profile never turns into a new
  // one for want of its record.
  if (editor.kind !== 'closed' && !isLoading && !loadError) {
    const existing =
      editor.kind === 'existing'
        ? profiles.find((profile) => profile.id === editor.profileId)
        : undefined;

    const handleSave = async (name: string, content: TResumeProfileContent) => {
      if (existing) await updateProfile(existing.id, { name, profile: content });
      else await createProfile({ name, profile: content });

      switchEditor({ kind: 'closed' });
    };

    return (
      <div data-editor="">
        <ResumeProfileEditor
          error={mutationError}
          initialContent={existing?.profile ?? createEmptyProfileContent()}
          initialName={existing?.name ?? ''}
          isSaving={isMutating}
          key={existing?.id ?? 'new'}
          onCancel={() => switchEditor({ kind: 'closed' })}
          onSave={handleSave}
          title={existing ? t('profile.editor.editTitle') : t('profile.editor.newTitle')}
        />
      </div>
    );
  }

  const handleDelete = (profile: TResumeProfileResponse) => {
    deleteProfile(profile.id).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  };

  const renderBody = () => {
    // The card has no padding, for its rows; the loading and error boxes
    // draw their own border, so they get the card's usual padding.
    if (isLoading)
      return (
        <div className="p-5">
          <LoadingState label={t('profile.loading')} />
        </div>
      );

    if (loadError)
      return (
        <div className="p-5">
          <ErrorState
            action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
            description={loadError.message}
            title={t('profile.loadErrorTitle')}
          />
        </div>
      );

    if (profiles.length === 0)
      return (
        <EmptyState
          description={t('profile.list.emptyDescription')}
          icon={<DocumentIcon className="h-5 w-5" />}
          title={t('profile.list.emptyTitle')}
        />
      );

    return (
      <ul className="divide-y divide-app-borderSoft">
        {profiles.map((profile, position) => (
          <ResumeProfileRow
            isDisabled={isMutating}
            key={profile.id}
            onDelete={handleDelete}
            onEdit={(selected) => switchEditor({ kind: 'existing', profileId: selected.id })}
            position={position}
            profile={profile}
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
          >
            {t('profile.list.newProfile')}
          </Button>
        )
      }
      padding="none"
      subtitle={t('profile.list.subtitle')}
      title={t('profile.list.title')}
      titleId="resume-profiles-heading"
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
