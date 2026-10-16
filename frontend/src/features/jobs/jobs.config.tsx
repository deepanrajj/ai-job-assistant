import type { ChangeEventHandler, ReactNode } from 'react';

import { Select, getSegmentClassName } from '../../components/ui';
import { JobCompanyCell } from './components/JobCompanyCell';
import { JobDetailAction } from './components/JobDetailAction';
import { StatusPill } from './components/StatusPill';
import { KanbanIcon, TableIcon } from '../../components/icons';
import type { TLanguage, TTranslationContextValue } from '../../i18n';
import { formatJobDate, formatJobSalary } from './jobs.utils';
import { APP_PATH_BUILDERS } from '../../routes/paths';
import { statusOptions } from './jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJob } from '../../types';
import type { IDataTableColumn, IDataTableSearchConfig } from '../../components/dataTable';
import type { TJobsViewMode, TStatusFilter } from './jobs.types';
import {
  MISSING_APPLICATION_KEYS,
  getMissingApplicationReason,
  type IApplicationHistory,
} from '../statusHistory';

/**
 * Params used to create localized jobs table columns.
 */
interface ICreateJobsColumnsParams {
  /** Application history for the applied date, or null while unavailable. */
  applicationHistory: IApplicationHistory | null;
  language: TLanguage;
  t: TTranslationContextValue['t'];
}

/**
 * Params used to create the jobs status filter control.
 */
interface ICreateJobsFiltersParams {
  onStatusFilterChange: ChangeEventHandler<HTMLSelectElement>;
  statusFilter: TStatusFilter;
  t: TTranslationContextValue['t'];
}

/**
 * Params used to create the jobs view toggle.
 */
interface ICreateJobsViewToggleParams {
  onViewModeChange: (viewMode: TJobsViewMode) => void;
  t: TTranslationContextValue['t'];
  viewMode: TJobsViewMode;
}

/**
 * Creates the jobs table search config.
 *
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {IDataTableSearchConfig<TJob>} Jobs search config.
 */
export const createJobsSearchConfig = (
  t: TTranslationContextValue['t'],
): IDataTableSearchConfig<TJob> => ({
  getSearchText: (job) => [job.company, job.roleTitle, job.location].filter(Boolean).join(' '),
  label: t('jobs.search'),
  placeholder: t('jobs.searchPlaceholder'),
});

/**
 * Creates the localized jobs table column config.
 *
 * @param {ICreateJobsColumnsParams} params Column config params.
 * @returns {IDataTableColumn<TJob>[]} Jobs table columns.
 */
export const createJobsColumns = ({
  applicationHistory,
  language,
  t,
}: ICreateJobsColumnsParams): IDataTableColumn<TJob>[] => [
  {
    cell: (job) => <JobCompanyCell company={job.company} jobUrl={job.jobUrl} />,
    header: t('jobs.company'),
    id: 'company',
    isRowHeader: true,
    mobileHeading: true,
    sortLabel: t('jobs.company'),
    sortValue: (job) => job.company,
    widthClassName: 'w-[14%]',
  },
  {
    cell: (job) => <div className="font-medium text-app-text">{job.roleTitle}</div>,
    header: t('jobs.role'),
    id: 'role',
    mobileCell: (job) => <div className="text-sm text-app-textSoft">{job.roleTitle}</div>,
    mobileHeading: true,
    sortLabel: t('jobs.role'),
    sortValue: (job) => job.roleTitle,
    widthClassName: 'w-[16%]',
  },
  {
    cell: (job) => <StatusPill status={job.status} />,
    header: t('jobs.status'),
    id: 'status',
    mobileHeading: true,
    sortLabel: t('jobs.status'),
    sortValue: (job) => t(JOB_STATUS_TRANSLATION_KEYS[job.status]),
    widthClassName: 'w-[12%]',
  },
  {
    cell: (job) => job.location ?? t('jobs.notSet'),
    className: 'text-sm text-app-textSoft',
    header: t('jobs.location'),
    id: 'location',
    sortLabel: t('jobs.location'),
    sortValue: (job) => job.location,
    widthClassName: 'w-[12%]',
  },
  {
    cell: (job) => formatJobSalary(job) ?? t('jobs.notSet'),
    className: 'text-sm text-app-textSoft',
    header: t('jobs.salary'),
    id: 'salary',
    sortLabel: t('jobs.salary'),
    sortValue: (job) => job.salaryMin ?? job.salaryMax,
    widthClassName: 'w-[11%]',
  },
  {
    // From recorded status history; a missing date says why, never guesses.
    cell: (job) => {
      const appliedAt = applicationHistory?.applications.get(job.id)?.appliedAt;

      if (appliedAt) return formatJobDate(appliedAt.toISOString(), language);

      return (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">
            {t(MISSING_APPLICATION_KEYS[getMissingApplicationReason(job, applicationHistory)])}
          </span>
        </>
      );
    },
    className: 'text-sm text-app-textSoft',
    header: t('jobs.dateApplied'),
    id: 'applied',
    sortLabel: t('jobs.dateApplied'),
    sortValue: (job) => applicationHistory?.applications.get(job.id)?.appliedAt,
    widthClassName: 'w-[11%]',
  },
  {
    cell: (job) => formatJobDate(job.updatedAt, language),
    className: 'text-sm text-app-textSoft',
    header: t('jobs.updated'),
    id: 'updated',
    sortLabel: t('jobs.updated'),
    sortValue: (job) => new Date(job.updatedAt),
    widthClassName: 'w-[10%]',
  },
  {
    cell: (job) => (
      // The table renders from md; below 2xl it has no room for the label
      // without scrolling sideways, so the button shows its icon only.
      // The phone list, below md, keeps the label.
      <JobDetailAction
        company={job.company}
        detailPath={APP_PATH_BUILDERS.jobDetail(job.id)}
        labelClassName="md:hidden 2xl:inline"
      />
    ),
    header: t('jobs.actions'),
    id: 'actions',
    mobileLabel: t('jobs.actions'),
    widthClassName: 'w-[14%]',
  },
];

/**
 * Creates the jobs page view switch, a segmented control choosing between
 * the table and Kanban layouts.
 *
 * @param {ICreateJobsViewToggleParams} params View toggle config params.
 * @returns {ReactNode} Jobs view toggle.
 */
export const createJobsViewToggle = ({
  onViewModeChange,
  t,
  viewMode,
}: ICreateJobsViewToggleParams): ReactNode => (
  <div
    aria-label={t('jobs.viewToggleLabel')}
    className="inline-flex w-fit rounded-full border border-app-border bg-app-surface2 p-1"
    role="group"
  >
    <button
      aria-pressed={viewMode === 'table'}
      className={getSegmentClassName(viewMode === 'table')}
      onClick={() => onViewModeChange('table')}
      type="button"
    >
      <TableIcon />
      {t('jobs.tableView')}
    </button>
    <button
      aria-pressed={viewMode === 'kanban'}
      className={getSegmentClassName(viewMode === 'kanban')}
      onClick={() => onViewModeChange('kanban')}
      type="button"
    >
      <KanbanIcon />
      {t('jobs.kanbanView')}
    </button>
  </div>
);

/**
 * Creates the jobs table filter controls.
 *
 * @param {ICreateJobsFiltersParams} params Filter config params.
 * @returns {ReactNode} Jobs table filters.
 */
export const createJobsFilters = ({
  onStatusFilterChange,
  statusFilter,
  t,
}: ICreateJobsFiltersParams): ReactNode => (
  <Select label={t('jobs.status')} onChange={onStatusFilterChange} value={statusFilter}>
    {statusOptions.map((status) => (
      <option key={status} value={status}>
        {status === 'ALL' ? t('jobs.allStatuses') : t(JOB_STATUS_TRANSLATION_KEYS[status])}
      </option>
    ))}
  </Select>
);
