import { memo, type FC } from 'react';

import { Button, Select, Tooltip } from '../../../components/ui';
import { StatusPill } from '../../jobs/components/StatusPill';
import { EditIcon, ExternalLinkIcon, TrashIcon } from '../../../components/icons';
import { useTranslation } from '../../../i18n';
import { classNames } from '../../../utils';
import { createJobDetailMetadataItems } from '../jobDetail.utils';
import { jobStatusOptions } from '../../jobs/jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJobDetail, type TJobStatus } from '../../../types';
import type { IJobDetailMetadataItem } from '../jobDetail.types';

/**
 * Props used by the job detail header.
 *
 * Each action is optional and its control is only offered when the handler
 * exists. The status select is the one control that always renders, so it is
 * disabled without `onStatusChange`: a select that silently snaps back reads
 * as a broken save rather than as a screen that cannot save yet.
 * `isChangingStatus` is a separate, orthogonal condition - the select stays
 * enabled while a change is in flight (see `aria-busy` below) and is only
 * ever disabled by the handler's absence.
 *
 * `isDeletingJob` reports the delete as in flight. It dims the button, sets
 * `aria-busy` and takes it out of pointer events, but deliberately does
 * **not** disable it: a focused element that becomes disabled is blurred,
 * which would drop a keyboard user's place for as long as the request runs
 * and leave them tabbing in from the top of the page to reach the failure.
 *
 * `pointer-events-none` is what a sighted mouse user gets instead. Without
 * it the button keeps its pointer cursor and hover styling while every click
 * is silently swallowed, which reads as a broken control rather than a busy
 * one. Keyboard activation still reaches the handler, and `JobDetailPage`
 * ignores it with an in-flight ref.
 */
interface IJobDetailHeaderProps {
  isChangingStatus?: boolean;
  isDeletingJob?: boolean;
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
  isChangingStatus = false,
  isDeletingJob = false,
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
              aria-busy={isChangingStatus}
              aria-label={t('jobDetail.statusLabel')}
              className="!h-9 !w-auto min-w-[7.5rem] !rounded-md !border-app-borderSoft !bg-app-surface !px-2.5 !pr-8"
              containerClassName="shrink-0"
              disabled={!onStatusChange}
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
                  aria-busy={isDeletingJob}
                  aria-label={t('jobDetail.deleteJob')}
                  className={classNames(
                    'w-9 !px-0',
                    isDeletingJob && 'pointer-events-none opacity-60',
                  )}
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

      <dl className="mt-5 grid gap-4 border-t border-app-borderSoft pt-5 sm:grid-cols-2 xl:grid-cols-3">
        {metadataItems.map((item) => (
          <MemoizedJobDetailMetadataItem item={item} key={item.id} />
        ))}
      </dl>
    </section>
  );
};

export const JobDetailHeader = memo(JobDetailHeaderComponent);
