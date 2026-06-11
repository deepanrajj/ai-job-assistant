import { memo, type FC } from 'react';

import { Badge } from '../../ui';
import { useTranslation } from '../../../i18n';
import { statusPillClasses } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJobStatus } from '../../../types';

/**
 * Props used by the job status pill.
 */
interface IStatusPillProps {
  status: TJobStatus;
}

/**
 * Renders a color-coded status pill for a job application status.
 *
 * @param {IStatusPillProps} props Component props.
 * @param {TJobStatus} props.status Application status to display.
 * @returns {JSX.Element} Styled status label.
 */
const StatusPillComponent: FC<IStatusPillProps> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <Badge className={`h-7 px-2.5 text-xs ring-1 ring-inset ${statusPillClasses[status]}`}>
      {t(JOB_STATUS_TRANSLATION_KEYS[status])}
    </Badge>
  );
};

export const StatusPill = memo(StatusPillComponent);
