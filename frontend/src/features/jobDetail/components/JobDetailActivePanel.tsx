import type { FC } from 'react';

import { JobDetailAiPanel } from './JobDetailAiPanel';
import { JobDetailNotesPanel } from './JobDetailNotesPanel';
import { JobDetailOverviewPanel } from './JobDetailOverviewPanel';
import { JobDetailTasksPanel } from './JobDetailTasksPanel';
import { JobDetailTimelinePanel } from './JobDetailTimelinePanel';
import type { TJobDetail, TJobDetailTab } from '../../../types';
import type { IJobDetailPageActions } from '../jobDetail.types';

/**
 * Props used by the active job detail panel dispatcher.
 */
interface IJobDetailActivePanelProps extends Omit<
  IJobDetailPageActions,
  'onDeleteJob' | 'onStatusChange'
> {
  activeTab: TJobDetailTab;
  job: TJobDetail;
}

/**
 * Renders the active job detail panel with only its supported actions.
 *
 * @param {IJobDetailActivePanelProps} props Component props.
 * @returns {JSX.Element} Active job detail panel.
 */
export const JobDetailActivePanel: FC<IJobDetailActivePanelProps> = ({
  activeTab,
  job,
  onAnalyzeJob,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
}) => {
  if (activeTab === 'tasks') return <JobDetailTasksPanel jobId={job.id} />;

  if (activeTab === 'notes')
    return (
      <JobDetailNotesPanel
        job={job}
        onCreateNote={onCreateNote ? (body) => onCreateNote(job.id, body) : undefined}
        onDeleteNote={onDeleteNote ? (noteId) => onDeleteNote(job.id, noteId) : undefined}
        onUpdateNote={
          onUpdateNote ? (noteId, body) => onUpdateNote(job.id, noteId, body) : undefined
        }
      />
    );

  if (activeTab === 'timeline') return <JobDetailTimelinePanel job={job} />;

  if (activeTab === 'ai')
    return (
      <JobDetailAiPanel
        job={job}
        onAnalyzeJob={onAnalyzeJob ? (analysis) => onAnalyzeJob(job.id, analysis) : undefined}
      />
    );

  return <JobDetailOverviewPanel job={job} />;
};
