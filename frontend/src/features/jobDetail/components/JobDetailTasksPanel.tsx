import { memo, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, ErrorState, Input, LoadingState } from '../../../components/ui';
import { useJobTasks } from '../useJobTasks';
import { useTranslation } from '../../../i18n';
import {
  getCompletedJobTaskCount,
  getJobTaskDueLabel,
  isJobTaskComplete,
} from '../jobDetail.utils';
import type { TJobTask } from '../../../types';

/**
 * Props used by the job detail tasks panel.
 */
interface IJobDetailTasksPanelProps {
  jobId: string;
}

/**
 * Props used by one editable task item.
 */
interface IJobDetailTaskItemProps {
  dueLabel: string;
  isComplete: boolean;
  isDisabled: boolean;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (task: TJobTask) => void;
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
  isDisabled,
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
        disabled={isDisabled}
        onChange={() => onToggleTask(task)}
        type="checkbox"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-app-text">{task.title}</p>
        <p className="mt-1 text-xs text-app-textMuted">{dueLabel}</p>
      </div>
      <Button
        aria-label={t('jobDetail.tasks.deleteTaskLabel', {
          title: task.title,
        })}
        disabled={isDisabled}
        onClick={() => onDeleteTask(task.id)}
        size="sm"
        variant="danger"
      >
        {t('jobDetail.tasks.deleteTask')}
      </Button>
    </li>
  );
};

const MemoizedJobDetailTaskItem = memo(JobDetailTaskItem);

/**
 * Renders and manages a job's preparation tasks against the backend.
 *
 * @param {IJobDetailTasksPanelProps} props Component props.
 * @returns {JSX.Element} Job tasks panel.
 */
const JobDetailTasksPanelComponent: FC<IJobDetailTasksPanelProps> = ({ jobId }) => {
  const { language, t } = useTranslation();
  const {
    createJobTask,
    deleteJobTask,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    reload,
    tasks,
    updateJobTask,
  } = useJobTasks(jobId);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const completedCount = getCompletedJobTaskCount(tasks);
  const canCreateTask = Boolean(newTaskTitle.trim() && newTaskDueDate && !isMutating);

  const handleCreateTask = (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateTask) return;

    createJobTask(newTaskTitle.trim(), newTaskDueDate);
    setNewTaskDueDate('');
    setNewTaskTitle('');
  };

  const handleToggleTask = (task: TJobTask) => {
    updateJobTask(task.id, {
      status: isJobTaskComplete(task) ? 'TODO' : 'DONE',
    });
  };

  if (isLoading)
    return (
      <Card title={t('jobDetail.tasks.title')}>
        <LoadingState label={t('jobDetail.tasks.loading')} />
      </Card>
    );

  if (loadError)
    return (
      <Card title={t('jobDetail.tasks.title')}>
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('jobDetail.tasks.loadErrorTitle')}
        />
      </Card>
    );

  return (
    <Card
      subtitle={t('jobDetail.tasks.summary', {
        completed: completedCount,
        total: tasks.length,
      })}
      title={t('jobDetail.tasks.title')}
    >
      {mutationError && <Alert className="mb-4">{mutationError.message}</Alert>}

      <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleCreateTask}>
        <Input
          disabled={isMutating}
          label={t('jobDetail.tasks.newTaskTitle')}
          onChange={(event) => setNewTaskTitle(event.target.value)}
          placeholder={t('jobDetail.tasks.newTaskPlaceholder')}
          value={newTaskTitle}
        />
        <Input
          disabled={isMutating}
          label={t('jobDetail.tasks.newTaskDueDate')}
          onChange={(event) => setNewTaskDueDate(event.target.value)}
          type="date"
          value={newTaskDueDate}
        />
        <Button className="self-end" disabled={!canCreateTask} type="submit">
          {t('jobDetail.tasks.addTask')}
        </Button>
      </form>

      <ul className="space-y-3">
        {tasks.map((task) => (
          <MemoizedJobDetailTaskItem
            dueLabel={getJobTaskDueLabel(task, language, t)}
            isComplete={isJobTaskComplete(task)}
            isDisabled={isMutating}
            key={task.id}
            onDeleteTask={deleteJobTask}
            onToggleTask={handleToggleTask}
            task={task}
          />
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailTasksPanel = memo(JobDetailTasksPanelComponent);
