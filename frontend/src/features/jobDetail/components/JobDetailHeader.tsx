import { memo, type FC } from 'react';

import { ExternalLinkIcon } from '../../../components/icons';
import { StatusPill } from '../../jobs/components/StatusPill';
import { createJobDetailMetadataItems } from '../jobDetail.utils';
import { useTranslation } from '../../../i18n';
import type { IJobDetailMetadataItem } from '../jobDetail.types';
import type { TJobDetail } from '../../../types';

/**
 * Props used by the job detail header.
 */
interface IJobDetailHeaderProps {
  job: TJobDetail;
}

/**
 * Props used by a job detail metadata item.
 */
interface IJobDetailMetadataItemProps {
  item: IJobDetailMetadataItem;
}

const JobDetailMetadataItem: FC<IJobDetailMetadataItemProps> = ({ item }) => (
  <div>
    <dt className="text-xs font-semibold uppercase text-app-textMuted">{item.label}</dt>
    <dd className="mt-1 text-sm text-app-textSoft">{item.value}</dd>
  </div>
);

/**
 * Renders the primary job detail identity, status, and key metadata.
 *
 * @param {IJobDetailHeaderProps} props Component props.
 * @returns {JSX.Element} Job detail header.
 */
const JobDetailHeaderComponent: FC<IJobDetailHeaderProps> = ({ job }) => {
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

        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={job.status} />
          <a
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 text-sm font-medium text-app-textSoft hover:bg-app-surface2 hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
            href={job.jobUrl}
            rel="noreferrer"
            target="_blank"
          >
            {t('jobDetail.openPosting')}
            <ExternalLinkIcon />
          </a>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-app-borderSoft pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {metadataItems.map((item) => (
          <JobDetailMetadataItem item={item} key={item.id} />
        ))}
      </dl>
    </section>
  );
};

export const JobDetailHeader = memo(JobDetailHeaderComponent);
