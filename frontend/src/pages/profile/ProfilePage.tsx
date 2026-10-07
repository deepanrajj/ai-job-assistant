import { useState, type FC } from 'react';

import { Alert, Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { ResumeProfileEditor } from '../../features/profile/components/ResumeProfileEditor';
import type { IResumeProfilesState } from '../../features/profile/useResumeProfiles';
import { useTranslation } from '../../i18n';
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
 * Props used by one profile card.
 */
interface IResumeProfileCardProps {
  isDisabled: boolean;
  onDelete: (profile: TResumeProfileResponse) => void;
  onEdit: (profile: TResumeProfileResponse) => void;
  profile: TResumeProfileResponse;
}

/**
 * Shows one profile's name, target role, summary, and how many entries it
 * has, with Edit and Delete.
 *
 * @param {IResumeProfileCardProps} props Component props.
 * @returns {JSX.Element} Profile card.
 */
const ResumeProfileCard: FC<IResumeProfileCardProps> = ({
  isDisabled,
  onDelete,
  onEdit,
  profile,
}) => {
  const { t } = useTranslation();
  const { education, highlights, links, summary, targetRole } = profile.profile;

  return (
    <li>
      <Card
        action={
          <div className="flex gap-2">
            <Button
              aria-label={t('profile.list.editLabel', { name: profile.name })}
              disabled={isDisabled}
              onClick={() => onEdit(profile)}
              size="sm"
            >
              {t('profile.list.edit')}
            </Button>
            <Button
              aria-label={t('profile.list.deleteLabel', { name: profile.name })}
              disabled={isDisabled}
              onClick={() => onDelete(profile)}
              size="sm"
              variant="danger"
            >
              {t('profile.list.delete')}
            </Button>
          </div>
        }
        subtitle={t(RESUME_PROFILE_TARGET_ROLE_TRANSLATION_KEYS[targetRole])}
        title={profile.name}
      >
        {summary && <p className="text-sm text-app-text">{summary}</p>}
        <p className="mt-2 text-xs text-app-textMuted">
          {t('profile.list.counts', {
            education: education.length,
            highlights: highlights.length,
            links: links.length,
          })}
        </p>
      </Card>
    </li>
  );
};

/**
 * The Profile page: a library of resume profiles aimed at different roles,
 * each with a summary, highlights, education, links, and notes. The list
 * and the editor take turns, so a long editor never sits beside a list on
 * a small screen.
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

  if (isLoading) return <LoadingState label={t('profile.loading')} />;

  if (loadError)
    return (
      <ErrorState
        action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
        description={loadError.message}
        title={t('profile.loadErrorTitle')}
      />
    );

  if (editor.kind !== 'closed') {
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
    );
  }

  const handleDelete = (profile: TResumeProfileResponse) => {
    deleteProfile(profile.id).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  };

  return (
    <section aria-labelledby="resume-profiles-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-app-text" id="resume-profiles-heading">
            {t('profile.list.title')}
          </h2>
          <p className="text-sm text-app-textMuted">{t('profile.list.subtitle')}</p>
        </div>
        <Button disabled={isMutating} onClick={() => switchEditor({ kind: 'new' })}>
          {t('profile.list.newProfile')}
        </Button>
      </div>
      {mutationError && <Alert>{mutationError.message}</Alert>}
      {profiles.length === 0 ? (
        <Card>
          <EmptyState
            description={t('profile.list.emptyDescription')}
            title={t('profile.list.emptyTitle')}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <ResumeProfileCard
              isDisabled={isMutating}
              key={profile.id}
              onDelete={handleDelete}
              onEdit={(selected) => switchEditor({ kind: 'existing', profileId: selected.id })}
              profile={profile}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
