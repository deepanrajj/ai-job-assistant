import { memo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { DetailsIcon } from '../../../components/icons';
import { useTranslation } from '../../../i18n';

/**
 * Props used by the jobs table detail action.
 */
interface IJobDetailActionProps {
  company: string;
  detailPath: string;
}

/**
 * Renders an icon-only link to the internal job detail page.
 *
 * @param {IJobDetailActionProps} props Component props.
 * @param {string} props.company Company name used in the accessible label.
 * @param {string} props.detailPath Internal job detail path.
 * @returns {JSX.Element} Icon-only detail action.
 */
const JobDetailActionComponent: FC<IJobDetailActionProps> = ({ company, detailPath }) => {
  const { t } = useTranslation();

  return (
    <Link
      aria-label={t('a11y.viewJobDetailsFor', { company })}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-textSoft transition hover:bg-app-surface2 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface"
      to={detailPath}
    >
      <DetailsIcon />
    </Link>
  );
};

export const JobDetailAction = memo(JobDetailActionComponent);
