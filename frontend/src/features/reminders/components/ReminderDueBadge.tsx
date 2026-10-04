import { memo, type FC } from 'react';

import { Badge } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import { formatCalendarDate } from '../../jobs/jobs.utils';
import { reminderDueBadgeClasses } from '../reminders.constants';
import type { TReminderDueState } from '../reminders.types';

/**
 * Props used by the reminder due badge.
 */
interface IReminderDueBadgeProps {
  dueDate: string;
  dueState: TReminderDueState;
}

/**
 * Renders an open reminder's due state as a coloured badge. The badge text
 * carries the state in words, so it never relies on colour alone.
 *
 * @param {IReminderDueBadgeProps} props Component props.
 * @returns {JSX.Element} Due state badge.
 */
const ReminderDueBadgeComponent: FC<IReminderDueBadgeProps> = ({ dueDate, dueState }) => {
  const { language, t } = useTranslation();
  const date = formatCalendarDate(dueDate, language);
  const label =
    dueState === 'today'
      ? t('reminders.dueToday')
      : t(dueState === 'overdue' ? 'reminders.overdue' : 'reminders.dueOn', { date });

  return (
    <Badge className={`h-6 px-2 text-xs ring-1 ring-inset ${reminderDueBadgeClasses[dueState]}`}>
      {label}
    </Badge>
  );
};

export const ReminderDueBadge = memo(ReminderDueBadgeComponent);
