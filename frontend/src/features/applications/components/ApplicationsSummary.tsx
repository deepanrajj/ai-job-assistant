import { memo, type FC } from 'react';

import { StatsBar } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import type { IApplicationDocumentCounts } from '../applications.types';

/**
 * Props used by the Applications stats bar.
 */
interface IApplicationsSummaryProps {
  counts: IApplicationDocumentCounts;
}

/**
 * Renders the document counts as one stats bar, like the Jobs page's:
 * submitted, not sent yet, and jobs with documents. The three share one
 * row from `sm` up and stack on phones.
 *
 * @param {IApplicationsSummaryProps} props Component props.
 * @returns {JSX.Element} Applications stats bar.
 */
const ApplicationsSummaryComponent: FC<IApplicationsSummaryProps> = ({ counts }) => {
  const { t } = useTranslation();

  return (
    <StatsBar
      className="sm:grid-cols-3"
      items={[
        {
          dotClassName: 'bg-success-500',
          id: 'submitted',
          label: t('applications.summary.submitted'),
          value: counts.submitted,
        },
        {
          dotClassName: 'bg-warning-500',
          id: 'notSent',
          label: t('applications.summary.notSent'),
          value: counts.notSent,
        },
        {
          dotClassName: 'bg-primary-500',
          id: 'jobs',
          label: t('applications.summary.jobs'),
          value: counts.jobs,
        },
      ]}
      label={t('applications.summary.label')}
    />
  );
};

export const ApplicationsSummary = memo(ApplicationsSummaryComponent);
