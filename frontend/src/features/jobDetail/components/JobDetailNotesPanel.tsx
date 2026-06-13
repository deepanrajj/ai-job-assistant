import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';
import type { TJobDetail } from '../../../types';

/**
 * Props used by the job detail notes panel.
 */
interface IJobDetailNotesPanelProps {
  job: TJobDetail;
}

/**
 * Renders saved notes for a job.
 *
 * @param {IJobDetailNotesPanelProps} props Component props.
 * @returns {JSX.Element} Job notes panel.
 */
const JobDetailNotesPanelComponent: FC<IJobDetailNotesPanelProps> = ({ job }) => {
  const { language, t } = useTranslation();

  return (
    <Card title={t('jobDetail.notes.title')}>
      <ul className="space-y-4">
        {job.notes.map((note) => (
          <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4" key={note.id}>
            <p className="text-sm leading-7 text-app-textSoft">{note.body}</p>
            <p className="mt-3 text-xs font-medium text-app-textMuted">
              {formatJobDate(note.createdAt, language)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailNotesPanel = memo(JobDetailNotesPanelComponent);
