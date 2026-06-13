import type { ChangeEventHandler, ReactNode } from 'react';

import { JobCompanyCell } from './components/JobCompanyCell';
import { JobDetailAction } from './components/JobDetailAction';
import { JobTags } from './components/JobTags';
import { StatusPill } from './components/StatusPill';
import { Button, Select } from '../../components/ui';
import { PlusIcon } from '../../components/icons';
import { formatJobDate, formatJobSalary } from './jobs.utils';
import { statusOptions } from './jobs.constants';
import type { TStatusFilter } from './jobs.types';
import type { IDataTableColumn, IDataTableSearchConfig } from '../../components/dataTable';
import type { TLanguage, TTranslationContextValue } from '../../i18n';
import { APP_PATH_BUILDERS } from '../../routes/paths';
import { JOB_STATUS_TRANSLATION_KEYS, type TJob } from '../../types';

/**
 * Params used to create localized jobs table columns.
 */
interface ICreateJobsColumnsParams {
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
 * Creates the jobs table search config.
 *
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {IDataTableSearchConfig<TJob>} Jobs search config.
 */
export const createJobsSearchConfig = (
  t: TTranslationContextValue['t'],
): IDataTableSearchConfig<TJob> => ({
  getSearchText: (job) =>
    [job.company, job.roleTitle, job.location, ...job.tags].filter(Boolean).join(' '),
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
  language,
  t,
}: ICreateJobsColumnsParams): IDataTableColumn<TJob>[] => [
  {
    cell: (job) => <JobCompanyCell company={job.company} jobUrl={job.jobUrl} />,
    header: t('jobs.company'),
    id: 'company',
    isRowHeader: true,
    sortLabel: t('jobs.company'),
    sortValue: (job) => job.company,
    widthClassName: 'w-[15%]',
  },
  {
    cell: (job) => (
      <div>
        <div className="font-medium text-app-text">{job.roleTitle}</div>
        <JobTags tags={job.tags} />
        {job.nextStep && (
          <p className="mt-2 text-sm text-app-textMuted">
            {t('jobs.nextStep', { nextStep: job.nextStep })}
          </p>
        )}
      </div>
    ),
    header: t('jobs.role'),
    id: 'role',
    sortLabel: t('jobs.role'),
    sortValue: (job) => job.roleTitle,
    widthClassName: 'w-[28%]',
  },
  {
    cell: (job) => <StatusPill status={job.status} />,
    header: t('jobs.status'),
    id: 'status',
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
    widthClassName: 'w-[14%]',
  },
  {
    cell: (job) => formatJobSalary(job) ?? t('jobs.notSet'),
    className: 'text-sm text-app-textSoft',
    header: t('jobs.salary'),
    id: 'salary',
    sortLabel: t('jobs.salary'),
    sortValue: (job) => job.salaryMin ?? job.salaryMax,
    widthClassName: 'w-[12%]',
  },
  {
    cell: (job) => formatJobDate(job.updatedAt, language),
    className: 'text-sm text-app-textSoft',
    header: t('jobs.updated'),
    id: 'updated',
    sortLabel: t('jobs.updated'),
    sortValue: (job) => new Date(job.updatedAt),
    widthClassName: 'w-[11%]',
  },
  {
    cell: (job) => (
      <JobDetailAction company={job.company} detailPath={APP_PATH_BUILDERS.jobDetail(job.id)} />
    ),
    className: 'text-right',
    header: t('jobs.actions'),
    headerClassName: 'text-right',
    id: 'actions',
    mobileLabel: t('jobs.actions'),
    widthClassName: 'w-[8%]',
  },
];

/**
 * Creates the jobs table action controls.
 *
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {ReactNode} Jobs table actions.
 */
export const createJobsActions = (t: TTranslationContextValue['t']): ReactNode => (
  <Button disabled leftIcon={<PlusIcon />} title={t('jobs.addJobComingNext')}>
    {t('jobs.addJob')}
  </Button>
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
