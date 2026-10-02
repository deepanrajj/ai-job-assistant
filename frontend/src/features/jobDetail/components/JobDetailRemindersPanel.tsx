import { memo, useCallback, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
} from '../../../components/ui';
import { ReminderDueBadge } from '../../reminders/components/ReminderDueBadge';
import { isReminderFormValid, type IReminderFormValues } from '../../../services';
import { getReminderItemKey, useJobReminders } from '../useJobReminders';
import { useTranslation } from '../../../i18n';
import { classNames } from '../../../utils';
import { getLocalIsoDate, getReminderDueState } from '../../reminders/reminders.utils';
import {
  REMINDER_TYPE_TRANSLATION_KEYS,
  type TJobReminderType,
  type TReminderItem,
} from '../../../types';

/**
 * Props used by the job detail reminders panel.
 */
interface IJobDetailRemindersPanelProps {
  jobId: string;
}

/**
 * The reminder type options offered by the type select, in display order.
 */
const reminderTypeOptions: readonly TJobReminderType[] = [
  'FOLLOW_UP',
  'INTERVIEW_PREP',
  'APPLICATION_DEADLINE',
  'OTHER',
];

/**
 * Empty form values used to seed the add-reminder form.
 */
const emptyReminderFormValues: IReminderFormValues = {
  dueDate: '',
  title: '',
  type: 'FOLLOW_UP',
};

/**
 * Converts a stored reminder into the form values its edit row starts from.
 * Only called for stored reminders, which always carry a type.
 *
 * @param {TReminderItem} item Stored reminder as currently loaded.
 * @returns {IReminderFormValues} Form values seeded from that reminder.
 */
const toReminderFormValues = (item: TReminderItem): IReminderFormValues => ({
  dueDate: item.dueDate,
  title: item.title,
  type: item.type ?? emptyReminderFormValues.type,
});

/**
 * Props used by the shared reminder field set.
 */
interface IReminderFieldsProps {
  disabled: boolean;
  onChange: (values: IReminderFormValues) => void;
  values: IReminderFormValues;
}

/**
 * Renders the editable fields a stored reminder carries: type, title, and
 * due date.
 *
 * @param {IReminderFieldsProps} props Component props.
 * @returns {JSX.Element} Reminder field set.
 */
const ReminderFields: FC<IReminderFieldsProps> = ({ disabled, onChange, values }) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 md:grid-cols-[200px_1fr_180px]">
      <Select
        disabled={disabled}
        label={t('jobDetail.reminders.fields.type')}
        onChange={(event) => onChange({ ...values, type: event.target.value as TJobReminderType })}
        value={values.type}
      >
        {reminderTypeOptions.map((type) => (
          <option key={type} value={type}>
            {t(REMINDER_TYPE_TRANSLATION_KEYS[type])}
          </option>
        ))}
      </Select>
      <Input
        disabled={disabled}
        label={t('jobDetail.reminders.fields.title')}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        value={values.title}
      />
      <Input
        disabled={disabled}
        label={t('jobDetail.reminders.fields.dueDate')}
        onChange={(event) => onChange({ ...values, dueDate: event.target.value })}
        type="date"
        value={values.dueDate}
      />
    </div>
  );
};

/**
 * Props used by one job detail reminder row.
 */
interface IJobDetailReminderItemProps {
  isDeleting: boolean;
  isDisabled: boolean;
  isSaving: boolean;
  item: TReminderItem;
  onDeleteReminder: (reminderId: string) => void;
  onSaveReminder: (reminderId: string, values: IReminderFormValues) => Promise<void>;
  onToggleReminder: (item: TReminderItem) => void;
  today: string;
}

/**
 * Renders one reminder: a completion checkbox, its title, its type (or
 * "Task" for a task reminder), and its due state. A stored reminder can be
 * opened for editing or deleted; a task reminder is edited in the Tasks
 * tab, so it offers neither.
 *
 * @param {IJobDetailReminderItemProps} props Component props.
 * @returns {JSX.Element} Job detail reminder row.
 */
const JobDetailReminderItem: FC<IJobDetailReminderItemProps> = ({
  isDeleting,
  isDisabled,
  isSaving,
  item,
  onDeleteReminder,
  onSaveReminder,
  onToggleReminder,
  today,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<IReminderFormValues>(() => toReminderFormValues(item));
  const dueState = getReminderDueState(item, today);
  const isStored = item.source === 'REMINDER';

  const handleEdit = () => {
    setValues(toReminderFormValues(item));
    setIsEditing(true);
  };

  /**
   * Leaves edit mode only once the save succeeds, so a failed request does
   * not throw away what the user typed.
   */
  const handleSave = async () => {
    try {
      await onSaveReminder(item.id, values);
      setIsEditing(false);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  if (isEditing)
    return (
      <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
        <ReminderFields disabled={isDisabled} onChange={setValues} values={values} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            aria-busy={isSaving}
            disabled={isDisabled || !isReminderFormValid(values)}
            onClick={handleSave}
            size="sm"
          >
            {t('jobDetail.reminders.saveReminder')}
          </Button>
          <Button
            disabled={isDisabled}
            onClick={() => setIsEditing(false)}
            size="sm"
            variant="ghost"
          >
            {t('jobDetail.reminders.cancel')}
          </Button>
        </div>
      </li>
    );

  return (
    <li
      className={classNames(
        'flex items-start gap-3 rounded-lg border border-app-borderSoft p-4',
        item.isComplete ? 'bg-app-surface' : 'bg-app-surface2',
      )}
    >
      <input
        aria-busy={isSaving}
        aria-label={t('jobDetail.reminders.completeLabel', { title: item.title })}
        checked={item.isComplete}
        className="mt-1 h-4 w-4 rounded border-app-border text-primary-600"
        disabled={isDisabled}
        onChange={() => onToggleReminder(item)}
        type="checkbox"
      />
      <div className="min-w-0 flex-1">
        <p
          className={classNames(
            'text-sm font-medium',
            item.isComplete ? 'text-app-textMuted line-through' : 'text-app-text',
          )}
        >
          {item.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-textMuted">
          <span>
            {item.type
              ? t(REMINDER_TYPE_TRANSLATION_KEYS[item.type])
              : t('jobDetail.reminders.taskSource')}
          </span>
          {dueState ? (
            <ReminderDueBadge dueDate={item.dueDate} dueState={dueState} />
          ) : (
            <span>{t('jobDetail.reminders.completed')}</span>
          )}
        </div>
      </div>
      {isStored && (
        <div className="flex flex-wrap gap-2">
          <Button
            aria-label={t('jobDetail.reminders.editReminderLabel', { title: item.title })}
            disabled={isDisabled}
            onClick={handleEdit}
            size="sm"
          >
            {t('jobDetail.reminders.editReminder')}
          </Button>
          <Button
            aria-busy={isDeleting}
            aria-label={t('jobDetail.reminders.deleteReminderLabel', { title: item.title })}
            disabled={isDisabled}
            onClick={() => onDeleteReminder(item.id)}
            size="sm"
            variant="danger"
          >
            {t('jobDetail.reminders.deleteReminder')}
          </Button>
        </div>
      )}
    </li>
  );
};

const MemoizedJobDetailReminderItem = memo(JobDetailReminderItem);

/**
 * Renders and manages a job's reminders: the ones the user set, and every
 * task with a due date. Open reminders come first in due-date order;
 * completed ones follow in their own, muted group so they can be reopened.
 *
 * @param {IJobDetailRemindersPanelProps} props Component props.
 * @returns {JSX.Element} Job reminders panel.
 */
const JobDetailRemindersPanelComponent: FC<IJobDetailRemindersPanelProps> = ({ jobId }) => {
  const { t } = useTranslation();
  const {
    createJobReminder,
    deleteJobReminder,
    deletingReminderIds,
    hasLoadedReminders,
    isCreating,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    reload,
    reminders,
    toggleReminderComplete,
    updateJobReminder,
    updatingItemKeys,
  } = useJobReminders(jobId);
  const [newReminderValues, setNewReminderValues] =
    useState<IReminderFormValues>(emptyReminderFormValues);
  const canCreateReminder = !isMutating && isReminderFormValid(newReminderValues);
  const today = getLocalIsoDate(new Date());
  const openReminders = reminders.filter((item) => !item.isComplete);
  const completedReminders = reminders.filter((item) => item.isComplete);

  /**
   * Resets the form only once the create succeeds, so a failed request
   * leaves the user's input in place to retry.
   */
  const handleCreateReminder = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateReminder) return;

    try {
      await createJobReminder(newReminderValues);
      setNewReminderValues(emptyReminderFormValues);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  /**
   * Returns the update promise unswallowed: the row awaits it to decide
   * whether to leave edit mode.
   */
  const handleSaveReminder = useCallback(
    (reminderId: string, values: IReminderFormValues) => updateJobReminder(reminderId, values),
    [updateJobReminder],
  );

  const handleToggleReminder = useCallback(
    (item: TReminderItem) => {
      toggleReminderComplete(item).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [toggleReminderComplete],
  );

  const handleDeleteReminder = useCallback(
    (reminderId: string) => {
      deleteJobReminder(reminderId).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [deleteJobReminder],
  );

  if (isLoading)
    return (
      <Card title={t('jobDetail.reminders.title')}>
        <LoadingState label={t('jobDetail.reminders.loading')} />
      </Card>
    );

  if (loadError && !hasLoadedReminders)
    return (
      <Card title={t('jobDetail.reminders.title')}>
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('jobDetail.reminders.loadErrorTitle')}
        />
      </Card>
    );

  const renderItem = (item: TReminderItem) => {
    const key = getReminderItemKey(item);
    const isDeleting = item.source === 'REMINDER' && deletingReminderIds.has(item.id);
    const isSaving = updatingItemKeys.has(key);

    return (
      <MemoizedJobDetailReminderItem
        isDeleting={isDeleting}
        isDisabled={isSaving || isDeleting}
        isSaving={isSaving}
        item={item}
        key={key}
        onDeleteReminder={handleDeleteReminder}
        onSaveReminder={handleSaveReminder}
        onToggleReminder={handleToggleReminder}
        today={today}
      />
    );
  };

  return (
    <Card subtitle={t('jobDetail.reminders.subtitle')} title={t('jobDetail.reminders.title')}>
      {mutationError && <Alert className="mb-4">{mutationError.message}</Alert>}
      {loadError && (
        <Alert className="mb-4">
          <p>{loadError.message}</p>
          <Button className="mt-2" onClick={reload} size="sm">
            {t('jobs.loadErrorRetry')}
          </Button>
        </Alert>
      )}

      <form className="mb-4 space-y-3" onSubmit={handleCreateReminder}>
        <ReminderFields
          disabled={isMutating}
          onChange={setNewReminderValues}
          values={newReminderValues}
        />
        <Button aria-busy={isCreating} disabled={!canCreateReminder} type="submit">
          {t('jobDetail.reminders.addReminder')}
        </Button>
      </form>

      {reminders.length === 0 ? (
        <EmptyState
          description={t('jobDetail.reminders.emptyDescription')}
          title={t('jobDetail.reminders.emptyTitle')}
        />
      ) : (
        <>
          <ul aria-label={t('jobDetail.reminders.openGroup')} className="space-y-3">
            {openReminders.map(renderItem)}
          </ul>
          {completedReminders.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 text-sm font-medium text-app-textMuted">
                {t('jobDetail.reminders.completedGroup')}
              </h3>
              <ul aria-label={t('jobDetail.reminders.completedGroup')} className="space-y-3">
                {completedReminders.map(renderItem)}
              </ul>
            </section>
          )}
        </>
      )}
    </Card>
  );
};

export const JobDetailRemindersPanel = memo(JobDetailRemindersPanelComponent);
