import { memo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { getButtonClassName } from '../../../components/ui';
import { DetailsIcon } from '../../../components/icons';
import { useTranslation } from '../../../i18n';

/**
 * Props used by the job detail action.
 */
interface IJobDetailActionProps {
  company: string;
  detailPath: string;
  /**
   * Classes for the visible "Open job" text, such as
   * `lg:hidden 2xl:inline` to show only the icon where space is short.
   * The link's own label keeps its accessible name either way.
   */
  labelClassName?: string;
}

/**
 * Renders "Open job" as a small soft primary button with the details
 * icon, linking to the internal job detail page. Shared by the Jobs table
 * and the Applications page. Its accessible name adds the company, as a
 * list of jobs has one per row or card.
 *
 * @param {IJobDetailActionProps} props Component props.
 * @param {string} props.company Company name used in the accessible label.
 * @param {string} props.detailPath Internal job detail path.
 * @param {string} [props.labelClassName] Optional classes for the visible label.
 * @returns {JSX.Element} Job detail action.
 */
const JobDetailActionComponent: FC<IJobDetailActionProps> = ({
  company,
  detailPath,
  labelClassName,
}) => {
  const { t } = useTranslation();

  return (
    <Link
      aria-label={t('jobs.openJobFor', { company })}
      className={getButtonClassName({
        className: 'whitespace-nowrap',
        size: 'sm',
        variant: 'soft',
      })}
      to={detailPath}
    >
      <DetailsIcon />
      <span className={labelClassName}>{t('jobs.openJob')}</span>
    </Link>
  );
};

export const JobDetailAction = memo(JobDetailActionComponent);
