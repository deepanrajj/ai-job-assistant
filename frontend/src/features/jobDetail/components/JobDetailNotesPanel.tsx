import { memo, useCallback, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, ErrorState, LoadingState, Textarea } from '../../../components/ui';
import { useJobNotes } from '../useJobNotes';
import { useTranslation, type TLanguage } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';
import type { TJobNote } from '../../../types';

/**
 * Props used by the job detail notes panel.
 */
interface IJobDetailNotesPanelProps {
  jobId: string;
}

/**
 * Props used by one editable note item.
 */
interface IJobDetailNoteItemProps {
  isDisabled: boolean;
  language: TLanguage;
  note: TJobNote;
  onDeleteNote: (noteId: string) => void;
  onSaveNote: (noteId: string, body: string) => void;
}

/**
 * Renders one editable note row inside the job detail notes panel.
 *
 * @param {IJobDetailNoteItemProps} props Component props.
 * @returns {JSX.Element} Job detail note row.
 */
const JobDetailNoteItem: FC<IJobDetailNoteItemProps> = ({
  isDisabled,
  language,
  note,
  onDeleteNote,
  onSaveNote,
}) => {
  const { t } = useTranslation();
  const [body, setBody] = useState(note.body);
  const createdAtLabel = formatJobDate(note.createdAt, language);

  return (
    <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
      <Textarea
        aria-label={t('jobDetail.notes.editNoteLabel', {
          date: createdAtLabel,
        })}
        className="min-h-28 bg-app-surface"
        disabled={isDisabled}
        onChange={(event) => setBody(event.target.value)}
        value={body}
      />
      <p className="mt-3 text-xs font-medium text-app-textMuted">{createdAtLabel}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-busy={isDisabled}
          aria-label={t('jobDetail.notes.saveNoteLabel', {
            date: createdAtLabel,
          })}
          disabled={isDisabled || !body.trim()}
          onClick={() => onSaveNote(note.id, body.trim())}
          size="sm"
        >
          {t('jobDetail.notes.saveNote')}
        </Button>
        <Button
          aria-busy={isDisabled}
          aria-label={t('jobDetail.notes.deleteNoteLabel', {
            date: createdAtLabel,
          })}
          disabled={isDisabled}
          onClick={() => onDeleteNote(note.id)}
          size="sm"
          variant="danger"
        >
          {t('jobDetail.notes.deleteNote')}
        </Button>
      </div>
    </li>
  );
};

const MemoizedJobDetailNoteItem = memo(JobDetailNoteItem);

/**
 * Renders and manages a job's notes against the backend.
 *
 * @param {IJobDetailNotesPanelProps} props Component props.
 * @returns {JSX.Element} Job notes panel.
 */
const JobDetailNotesPanelComponent: FC<IJobDetailNotesPanelProps> = ({ jobId }) => {
  const { language, t } = useTranslation();
  const {
    createJobNote,
    deleteJobNote,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    notes,
    reload,
    updateJobNote,
  } = useJobNotes(jobId);
  const [newNoteBody, setNewNoteBody] = useState('');
  const canCreateNote = Boolean(newNoteBody.trim() && !isMutating);

  /**
   * The textarea is only cleared once the create request actually
   * succeeds, the same reason `JobDetailTasksPanel`'s create form waits:
   * clearing it beforehand would lose the user's note the moment a failed
   * request left them with nothing to retry but retyping it.
   */
  const handleCreateNote = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateNote) return;

    try {
      await createJobNote(newNoteBody.trim());
      setNewNoteBody('');
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  const handleSaveNote = useCallback(
    (noteId: string, body: string) => {
      updateJobNote(noteId, body).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [updateJobNote],
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      deleteJobNote(noteId).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [deleteJobNote],
  );

  if (isLoading)
    return (
      <Card title={t('jobDetail.notes.title')}>
        <LoadingState label={t('jobDetail.notes.loading')} />
      </Card>
    );

  if (loadError)
    return (
      <Card title={t('jobDetail.notes.title')}>
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('jobDetail.notes.loadErrorTitle')}
        />
      </Card>
    );

  return (
    <Card title={t('jobDetail.notes.title')}>
      {mutationError && <Alert className="mb-4">{mutationError.message}</Alert>}

      <form className="mb-4 space-y-3" onSubmit={handleCreateNote}>
        <Textarea
          className="min-h-28"
          disabled={isMutating}
          label={t('jobDetail.notes.newNote')}
          onChange={(event) => setNewNoteBody(event.target.value)}
          placeholder={t('jobDetail.notes.notePlaceholder')}
          value={newNoteBody}
        />
        <Button aria-busy={isMutating} disabled={!canCreateNote} type="submit">
          {t('jobDetail.notes.addNote')}
        </Button>
      </form>

      <ul className="space-y-4">
        {notes.map((note) => (
          <MemoizedJobDetailNoteItem
            isDisabled={isMutating}
            key={note.id}
            language={language}
            note={note}
            onDeleteNote={handleDeleteNote}
            onSaveNote={handleSaveNote}
          />
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailNotesPanel = memo(JobDetailNotesPanelComponent);
