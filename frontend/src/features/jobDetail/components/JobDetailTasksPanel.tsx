import { memo, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Button, Card, Input } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import {
  getCompletedJobTaskCount,
  getJobTaskDueLabel,
  isJobTaskComplete,
} from '../jobDetail.utils';
import type { TJobDetail, TJobTask } from '../../../types';
import type { IUpdateJobTaskInput } from '../../jobs/jobsStore.types';

/**
 * Props used by the job detail tasks panel.
 */
interface IJobDetailTasksPanelProps {
  job: TJobDetail;
  onCreateTask?: (title: string, dueDate: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, input: IUpdateJobTaskInput) => void;
}

/**
 * Props used by one editable task item.
 */
interface IJobDetailTaskItemProps {
  dueLabel: string;
  isComplete: boolean;
  onDeleteTask?: (taskId: string) => void;
  onToggleTask?: (task: TJobTask) => void;
  task: TJobTask;
}

/**
 * Renders one editable task row inside the job detail tasks panel.
 *
 * @param {IJobDetailTaskItemProps} props Component props.
 * @returns {JSX.Element} Job detail task row.
 */
const JobDetailTaskItem: FC<IJobDetailTaskItemProps> = ({
  dueLabel,
  isComplete,
  onDeleteTask,
  onToggleTask,
  task,
}) => {
  const { t } = useTranslation();

  return (
    <li className="flex items-start gap-3 rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
      <input
        aria-label={task.title}
        checked={isComplete}
        className="mt-1 h-4 w-4 rounded border-app-border text-primary-600"
        disabled={!onToggleTask}
        onChange={() => onToggleTask?.(task)}
        type="checkbox"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-app-text">{task.title}</p>
        <p className="mt-1 text-xs text-app-textMuted">{dueLabel}</p>
      </div>
      {onDeleteTask && (
        <Button
          aria-label={t('jobDetail.tasks.deleteTaskLabel', {
            title: task.title,
          })}
          onClick={() => onDeleteTask(task.id)}
          size="sm"
          variant="danger"
        >
          {t('jobDetail.tasks.deleteTask')}
        </Button>
      )}
    </li>
  );
};

const MemoizedJobDetailTaskItem = memo(JobDetailTaskItem);

/**
 * Renders saved preparation tasks for a job.
 *
 * @param {IJobDetailTasksPanelProps} props Component props.
 * @returns {JSX.Element} Job tasks panel.
 */
const JobDetailTasksPanelComponent: FC<IJobDetailTasksPanelProps> = ({
  job,
  onCreateTask,
  onDeleteTask,
  onUpdateTask,
}) => {
  const { language, t } = useTranslation();
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const completedCount = getCompletedJobTaskCount(job.tasks);
  const canCreateTask = Boolean(onCreateTask && newTaskTitle.trim() && newTaskDueDate);

  const handleCreateTask = (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateTask) return;

    onCreateTask?.(newTaskTitle.trim(), newTaskDueDate);
    setNewTaskDueDate('');
    setNewTaskTitle('');
  };

  const handleToggleTask = (task: TJobTask) => {
    onUpdateTask?.(task.id, {
      status: isJobTaskComplete(task) ? 'TODO' : 'DONE',
    });
  };

  return (
    <Card
      subtitle={t('jobDetail.tasks.summary', {
        completed: completedCount,
        total: job.tasks.length,
      })}
      title={t('jobDetail.tasks.title')}
    >
      {onCreateTask && (
        <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleCreateTask}>
          <Input
            label={t('jobDetail.tasks.newTaskTitle')}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder={t('jobDetail.tasks.newTaskPlaceholder')}
            value={newTaskTitle}
          />
          <Input
            label={t('jobDetail.tasks.newTaskDueDate')}
            onChange={(event) => setNewTaskDueDate(event.target.value)}
            type="date"
            value={newTaskDueDate}
          />
          <Button className="self-end" disabled={!canCreateTask} type="submit">
            {t('jobDetail.tasks.addTask')}
          </Button>
        </form>
      )}

      <ul className="space-y-3">
        {job.tasks.map((task) => (
          <MemoizedJobDetailTaskItem
            dueLabel={getJobTaskDueLabel(task, language, t)}
            isComplete={isJobTaskComplete(task)}
            key={task.id}
            onDeleteTask={onDeleteTask}
            onToggleTask={onUpdateTask ? handleToggleTask : undefined}
            task={task}
          />
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailTasksPanel = memo(JobDetailTasksPanelComponent);
