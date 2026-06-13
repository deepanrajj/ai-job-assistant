import { memo, type FC } from 'react';

import { Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import {
  getCompletedJobTaskCount,
  getJobTaskDueLabel,
  isJobTaskComplete,
} from '../jobDetail.utils';
import type { TJobDetail, TJobTask } from '../../../types';

/**
 * Props used by the job detail tasks panel.
 */
interface IJobDetailTasksPanelProps {
  job: TJobDetail;
}

/**
 * Props used by one job detail task item.
 */
interface IJobDetailTaskItemProps {
  dueLabel: string;
  isComplete: boolean;
  task: TJobTask;
}

const JobDetailTaskItem: FC<IJobDetailTaskItemProps> = ({ dueLabel, isComplete, task }) => (
  <li className="flex items-start gap-3 rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
    <input
      aria-label={task.title}
      checked={isComplete}
      className="mt-1 h-4 w-4 rounded border-app-border text-primary-600"
      readOnly
      type="checkbox"
    />
    <div>
      <p className="text-sm font-medium text-app-text">{task.title}</p>
      <p className="mt-1 text-xs text-app-textMuted">{dueLabel}</p>
    </div>
  </li>
);

/**
 * Renders one read-only task row inside the job detail tasks panel.
 *
 * @param {IJobDetailTaskItemProps} props Component props.
 * @returns {JSX.Element} Job detail task row.
 */
const MemoizedJobDetailTaskItem = memo(JobDetailTaskItem);

/**
 * Renders saved preparation tasks for a job.
 *
 * @param {IJobDetailTasksPanelProps} props Component props.
 * @returns {JSX.Element} Job tasks panel.
 */
const JobDetailTasksPanelComponent: FC<IJobDetailTasksPanelProps> = ({ job }) => {
  const { language, t } = useTranslation();
  const completedCount = getCompletedJobTaskCount(job.tasks);

  return (
    <Card
      subtitle={t('jobDetail.tasks.summary', {
        completed: completedCount,
        total: job.tasks.length,
      })}
      title={t('jobDetail.tasks.title')}
    >
      <ul className="space-y-3">
        {job.tasks.map((task) => (
          <MemoizedJobDetailTaskItem
            dueLabel={getJobTaskDueLabel(task, language, t)}
            isComplete={isJobTaskComplete(task)}
            key={task.id}
            task={task}
          />
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailTasksPanel = memo(JobDetailTasksPanelComponent);
