import { memo, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Button, Card, Textarea } from '../../../components/ui';
import { useTranslation, type TLanguage } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';
import type { TJobDetail, TJobNote } from '../../../types';

/**
 * Props used by the job detail notes panel.
 */
interface IJobDetailNotesPanelProps {
  job: TJobDetail;
  onCreateNote?: (body: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onUpdateNote?: (noteId: string, body: string) => void;
}

/**
 * Props used by one editable note item.
 */
interface IJobDetailNoteItemProps {
  language: TLanguage;
  note: TJobNote;
  onDeleteNote?: (noteId: string) => void;
  onUpdateNote?: (noteId: string, body: string) => void;
}

/**
 * Renders one editable note row inside the job detail notes panel.
 *
 * @param {IJobDetailNoteItemProps} props Component props.
 * @returns {JSX.Element} Job detail note row.
 */
const JobDetailNoteItem: FC<IJobDetailNoteItemProps> = ({
  language,
  note,
  onDeleteNote,
  onUpdateNote,
}) => {
  const { t } = useTranslation();
  const [body, setBody] = useState(note.body);
  const createdAtLabel = formatJobDate(note.createdAt, language);
  const canUpdateNote = Boolean(onUpdateNote);

  return (
    <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
      <Textarea
        aria-label={t('jobDetail.notes.editNoteLabel', {
          date: createdAtLabel,
        })}
        className="min-h-28 bg-app-surface"
        onChange={(event) => setBody(event.target.value)}
        readOnly={!canUpdateNote}
        value={body}
      />
      <p className="mt-3 text-xs font-medium text-app-textMuted">{createdAtLabel}</p>
      {(onUpdateNote || onDeleteNote) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onUpdateNote && (
            <Button
              aria-label={t('jobDetail.notes.saveNoteLabel', {
                date: createdAtLabel,
              })}
              disabled={!body.trim()}
              onClick={() => onUpdateNote(note.id, body.trim())}
              size="sm"
            >
              {t('jobDetail.notes.saveNote')}
            </Button>
          )}
          {onDeleteNote && (
            <Button
              aria-label={t('jobDetail.notes.deleteNoteLabel', {
                date: createdAtLabel,
              })}
              onClick={() => onDeleteNote(note.id)}
              size="sm"
              variant="danger"
            >
              {t('jobDetail.notes.deleteNote')}
            </Button>
          )}
        </div>
      )}
    </li>
  );
};

const MemoizedJobDetailNoteItem = memo(JobDetailNoteItem);

/**
 * Renders saved notes for a job.
 *
 * @param {IJobDetailNotesPanelProps} props Component props.
 * @returns {JSX.Element} Job notes panel.
 */
const JobDetailNotesPanelComponent: FC<IJobDetailNotesPanelProps> = ({
  job,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
}) => {
  const { language, t } = useTranslation();
  const [newNoteBody, setNewNoteBody] = useState('');

  const handleCreateNote = (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newNoteBody.trim()) return;

    onCreateNote?.(newNoteBody.trim());
    setNewNoteBody('');
  };

  return (
    <Card title={t('jobDetail.notes.title')}>
      {onCreateNote && (
        <form className="mb-4 space-y-3" onSubmit={handleCreateNote}>
          <Textarea
            className="min-h-28"
            label={t('jobDetail.notes.newNote')}
            onChange={(event) => setNewNoteBody(event.target.value)}
            placeholder={t('jobDetail.notes.notePlaceholder')}
            value={newNoteBody}
          />
          <Button disabled={!newNoteBody.trim()} type="submit">
            {t('jobDetail.notes.addNote')}
          </Button>
        </form>
      )}

      <ul className="space-y-4">
        {job.notes.map((note) => (
          <MemoizedJobDetailNoteItem
            key={note.id}
            language={language}
            note={note}
            onDeleteNote={onDeleteNote}
            onUpdateNote={onUpdateNote}
          />
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailNotesPanel = memo(JobDetailNotesPanelComponent);
