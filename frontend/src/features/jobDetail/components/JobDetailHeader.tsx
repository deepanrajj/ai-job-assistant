import { memo, type FC } from 'react';

import { Button, Select, Tooltip } from '../../../components/ui';
import { StatusPill } from '../../jobs/components/StatusPill';
import { EditIcon, ExternalLinkIcon, TrashIcon } from '../../../components/icons';
import { useTranslation } from '../../../i18n';
import { createJobDetailMetadataItems } from '../jobDetail.utils';
import { jobStatusOptions } from '../../jobs/jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJobDetail, type TJobStatus } from '../../../types';
import type { IJobDetailMetadataItem } from '../jobDetail.types';

/**
 * Props used by the job detail header.
 */
interface IJobDetailHeaderProps {
  job: TJobDetail;
  onDeleteJob?: () => void;
  onEditJob?: () => void;
  onStatusChange?: (status: TJobStatus) => void;
}

/**
 * Props used by a job detail metadata item.
 */
interface IJobDetailMetadataItemProps {
  item: IJobDetailMetadataItem;
}

/**
 * Renders one label/value pair inside the job detail metadata list.
 *
 * @param {IJobDetailMetadataItemProps} props Component props.
 * @returns {JSX.Element} Job detail metadata item.
 */
const JobDetailMetadataItem: FC<IJobDetailMetadataItemProps> = ({ item }) => (
  <div>
    <dt className="text-xs font-semibold uppercase text-app-textMuted">{item.label}</dt>
    <dd className="mt-1 text-sm text-app-textSoft">{item.value}</dd>
  </div>
);

const MemoizedJobDetailMetadataItem = memo(JobDetailMetadataItem);

/**
 * Renders the primary job detail identity, status, and key metadata.
 *
 * @param {IJobDetailHeaderProps} props Component props.
 * @returns {JSX.Element} Job detail header.
 */
const JobDetailHeaderComponent: FC<IJobDetailHeaderProps> = ({
  job,
  onDeleteJob,
  onEditJob,
  onStatusChange,
}) => {
  const { language, t } = useTranslation();
  const metadataItems = createJobDetailMetadataItems(job, language, t);

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">{job.company}</p>
          <h2 className="mt-1 text-2xl font-semibold text-app-text">{job.roleTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-app-textMuted">{job.description}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <StatusPill status={job.status} />

          <div className="flex items-center gap-1 rounded-xl border border-app-borderSoft bg-app-surface2 p-1">
            <Select
              aria-label={t('jobDetail.statusLabel')}
              className="!h-9 !w-auto min-w-[7.5rem] !rounded-md !border-app-borderSoft !bg-app-surface !px-2.5 !pr-8"
              containerClassName="shrink-0"
              onChange={(event) => onStatusChange?.(event.target.value as TJobStatus)}
              value={job.status}
            >
              {jobStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(JOB_STATUS_TRANSLATION_KEYS[status])}
                </option>
              ))}
            </Select>
            {job.jobUrl && (
              <Tooltip content={t('jobDetail.openPosting')}>
                <a
                  aria-label={t('jobDetail.openPosting')}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-textSoft hover:bg-app-surface2 hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
                  href={job.jobUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </Tooltip>
            )}
            {onEditJob && (
              <Tooltip content={t('jobDetail.editJob')}>
                <Button
                  aria-label={t('jobDetail.editJob')}
                  className="w-9 !px-0"
                  onClick={onEditJob}
                  size="sm"
                  variant="secondary"
                >
                  <EditIcon />
                </Button>
              </Tooltip>
            )}
            {onDeleteJob && (
              <Tooltip content={t('jobDetail.deleteJob')}>
                <Button
                  aria-label={t('jobDetail.deleteJob')}
                  className="w-9 !px-0"
                  onClick={onDeleteJob}
                  size="sm"
                  variant="danger"
                >
                  <TrashIcon />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-app-borderSoft pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {metadataItems.map((item) => (
          <MemoizedJobDetailMetadataItem item={item} key={item.id} />
        ))}
      </dl>
    </section>
  );
};

export const JobDetailHeader = memo(JobDetailHeaderComponent);
