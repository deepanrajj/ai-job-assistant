import { memo, type FC } from 'react';

import { ExternalLinkIcon } from '../../icons';
import { useTranslation } from '../../../i18n';

/**
 * Props used by the jobs table company cell.
 */
interface IJobCompanyCellProps {
  company: string;
  jobUrl?: string;
}

/**
 * Renders the company name and external job posting link for a jobs table row.
 *
 * @param {IJobCompanyCellProps} props Component props.
 * @param {string} props.company Company name.
 * @param {string | undefined} props.jobUrl External job posting URL.
 * @returns {JSX.Element} Jobs table company cell.
 */
const JobCompanyCellComponent: FC<IJobCompanyCellProps> = ({ company, jobUrl }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="font-medium text-app-text">{company}</div>
      {jobUrl && (
        <a
          aria-label={t('a11y.openPostingFor', {
            company,
          })}
          className="mt-1 inline-flex items-center gap-1 rounded text-xs text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface"
          href={jobUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t('jobs.openPosting')}
          <ExternalLinkIcon />
        </a>
      )}
    </div>
  );
};

export const JobCompanyCell = memo(JobCompanyCellComponent);
