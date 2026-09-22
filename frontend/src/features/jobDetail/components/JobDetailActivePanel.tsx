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
}) => {
  // Keyed on the job id so a jobId change - a navigation that keeps this
  // subtree mounted, such as an edited URL - remounts the panel instead of
  // reusing it: `useJobTasks`/`useJobNotes`/`useJobTimeline` refetch either
  // way, but only a remount also clears a mutation failure left over from
  // the previous job (tasks and notes) instead of briefly rendering the
  // previous job's already-loaded data under the new heading.
  if (activeTab === 'tasks') return <JobDetailTasksPanel jobId={job.id} key={job.id} />;

  if (activeTab === 'notes') return <JobDetailNotesPanel jobId={job.id} key={job.id} />;

  if (activeTab === 'timeline') return <JobDetailTimelinePanel jobId={job.id} key={job.id} />;

  if (activeTab === 'ai')
    return (
      <JobDetailAiPanel
        job={job}
        onAnalyzeJob={onAnalyzeJob ? (analysis) => onAnalyzeJob(job.id, analysis) : undefined}
      />
    );

  return <JobDetailOverviewPanel job={job} />;
};
