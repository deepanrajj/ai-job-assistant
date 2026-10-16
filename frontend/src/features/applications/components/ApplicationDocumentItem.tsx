import type { FC } from 'react';

import { Badge } from '../../../components/ui';
import { ExternalLinkIcon } from '../../../components/icons';
import { useTranslation } from '../../../i18n';
import { classNames } from '../../../utils';
import { formatCalendarDate } from '../../jobs/jobs.utils';
import { DOCUMENT_TYPE_TONES } from '../applications.constants';
import { DOCUMENT_TYPE_TRANSLATION_KEYS } from '../../../types';
import type { TApplicationDocument } from '../applications.types';

/**
 * Props used by one application document.
 */
interface IApplicationDocumentItemProps {
  document: TApplicationDocument;
  /** Shows the type badge; the matrix leaves it out, as its column names the type. */
  showType?: boolean;
}

/**
 * One application document, as both Applications layouts show it: a sent
 * (filled green) or not-sent (amber ring) marker, the version label, an
 * optional type badge, "Submitted {date}" or "Not sent yet", and "Open
 * link" named after the label, since a row or card can hold several.
 *
 * @param {IApplicationDocumentItemProps} props Component props.
 * @returns {JSX.Element} Application document.
 */
export const ApplicationDocumentItem: FC<IApplicationDocumentItemProps> = ({
  document,
  showType = false,
}) => {
  const { language, t } = useTranslation();
  const isSent = Boolean(document.submittedAt);

  return (
    <div className="flex min-w-0 gap-2">
      <span
        aria-hidden="true"
        className={classNames(
          'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
          isSent ? 'bg-success-500' : 'ring-2 ring-inset ring-warning-500',
        )}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 break-words text-sm font-medium text-app-text">{document.title}</p>
          {showType && (
            <Badge
              className={classNames('px-2 py-0.5 text-xs', DOCUMENT_TYPE_TONES[document.type])}
            >
              {t(DOCUMENT_TYPE_TRANSLATION_KEYS[document.type])}
            </Badge>
          )}
        </div>
        <p className={classNames('text-xs', isSent ? 'text-app-textMuted' : 'text-warning-800')}>
          {document.submittedAt
            ? t('jobDetail.documents.submittedOn', {
                date: formatCalendarDate(document.submittedAt, language),
              })
            : t('jobDetail.documents.notSentYet')}
        </p>
        {document.url && (
          <a
            aria-label={t('applications.openLinkFor', { title: document.title })}
            className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            href={document.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('applications.openLink')}
            <ExternalLinkIcon />
          </a>
        )}
      </div>
    </div>
  );
};
