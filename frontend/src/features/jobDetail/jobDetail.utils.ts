import type { TLanguage, TTranslationContextValue } from '../../i18n';
import { formatJobDate, formatJobSalary } from '../jobs/jobs.utils';
import type { TJobDetail, TJobDetailTab, TJobTask } from '../../types';
import type { IJobDetailMetadataItem } from './jobDetail.types';

/**
 * Creates localized metadata items for the job detail header.
 *
 * @param {TJobDetail} job Job detail data.
 * @param {TLanguage} language Active language used for date formatting.
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {IJobDetailMetadataItem[]} Localized metadata items.
 */
export const createJobDetailMetadataItems = (
  job: TJobDetail,
  language: TLanguage,
  t: TTranslationContextValue['t'],
): IJobDetailMetadataItem[] => [
  {
    id: 'location',
    label: t('jobs.location'),
    value: job.location.trim() || t('jobs.notSet'),
  },
  {
    id: 'salary',
    label: t('jobs.salary'),
    value: formatJobSalary(job) ?? t('jobs.notSet'),
  },
  {
    id: 'updated',
    label: t('jobs.updated'),
    value: formatJobDate(job.updatedAt, language),
  },
  {
    id: 'nextStep',
    label: t('jobDetail.nextStep'),
    value: job.nextStep.trim() || t('jobs.notSet'),
  },
];

/**
 * Builds the DOM id for a job detail tab.
 *
 * @param {TJobDetailTab} tab Job detail tab id.
 * @returns {string} Stable tab DOM id.
 */
export const getJobDetailTabId = (tab: TJobDetailTab): string => `job-detail-${tab}-tab`;

/**
 * Builds the DOM id for a job detail tab panel.
 *
 * @param {TJobDetailTab} tab Job detail tab id.
 * @returns {string} Stable tab panel DOM id.
 */
export const getJobDetailPanelId = (tab: TJobDetailTab): string => `job-detail-${tab}-panel`;

/**
 * Checks whether a job detail task is completed.
 *
 * @param {TJobTask} task Job detail task.
 * @returns {boolean} True when the task is complete.
 */
export const isJobTaskComplete = (task: TJobTask): boolean => task.status === 'DONE';

/**
 * Counts completed job detail tasks.
 *
 * @param {TJobTask[]} tasks Job detail tasks.
 * @returns {number} Number of completed tasks.
 */
export const getCompletedJobTaskCount = (tasks: TJobTask[]): number =>
  tasks.filter(isJobTaskComplete).length;

/**
 * Formats the due-date label for a job detail task.
 *
 * @param {TJobTask} task Job detail task.
 * @param {TLanguage} language Active language used for date formatting.
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {string} Localized due-date label.
 */
export const getJobTaskDueLabel = (
  task: TJobTask,
  language: TLanguage,
  t: TTranslationContextValue['t'],
): string =>
  t('jobDetail.tasks.due', {
    date: formatJobDate(task.dueDate, language),
  });
