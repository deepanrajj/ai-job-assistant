import {
  useEffect,
  useId,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { useTranslation } from '../../../i18n';
import { jobStatusOptions, statusPillClasses, statusSolidClasses } from '../jobs.constants';
import { JOB_STATUS_TRANSLATION_KEYS, type TJobStatus } from '../../../types';

/**
 * Props used by the status pill control.
 */
interface IJobStatusMenuProps {
  company: string;
  currentStatus: TJobStatus;
  /** Focuses the pill once on mount, such as after the card moved column. */
  focusOnMount?: boolean;
  /** Content beside the pill, such as the card's link; the status list spans below both. */
  leading?: ReactNode;
  onFocused?: () => void;
  onSelect: (status: TJobStatus) => void;
}

/**
 * Renders the job's status as a pill that, when pressed, reveals the other
 * statuses as buttons underneath. It is a disclosure of plain buttons
 * rather than an ARIA menu, so a mouse, touch, the keyboard (Tab, Enter,
 * Space), and screen readers all use it the same way, with no library.
 * Opening it moves focus to the first status; Escape closes it and returns
 * focus to the pill; a pointer press outside closes it too.
 *
 * The pill's name starts with its visible status, so voice control can
 * say "click Interview". The list sits in the card's flow rather than
 * floating, so the board's horizontal scroll container cannot clip it.
 *
 * @param {IJobStatusMenuProps} props Component props.
 * @returns {JSX.Element} Status pill control.
 */
export const JobStatusMenu: FC<IJobStatusMenuProps> = ({
  company,
  currentStatus,
  focusOnMount = false,
  leading,
  onFocused,
  onSelect,
}) => {
  const { t } = useTranslation();
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const currentLabel = t(JOB_STATUS_TRANSLATION_KEYS[currentStatus]);
  const otherStatuses = jobStatusOptions.filter((status) => status !== currentStatus);

  useEffect(() => {
    if (!focusOnMount) return;

    toggleRef.current?.focus();
    onFocused?.();
  }, [focusOnMount, onFocused]);

  useEffect(() => {
    if (!isOpen) return;

    containerRef.current?.querySelector<HTMLButtonElement>('li button')?.focus();

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [isOpen]);

  // On every button of the control, so Escape works wherever focus is in it.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Escape' || !isOpen) return;

    event.stopPropagation();
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <div ref={containerRef}>
      <div className="flex items-start justify-between gap-3">
        {leading}
        <button
          // Only while the list exists, so the reference never dangles.
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen}
          aria-label={t('jobs.moveStatus.toggle', { company, status: currentLabel })}
          className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${statusPillClasses[currentStatus]}`}
          onClick={() => setIsOpen((open) => !open)}
          onKeyDown={handleKeyDown}
          ref={toggleRef}
          type="button"
        >
          {currentLabel}
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
            <path
              d={isOpen ? 'm5 12.5 5-5 5 5' : 'm5 7.5 5 5 5-5'}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <ul
          aria-label={t('jobs.moveStatus.listLabel', { company })}
          className="mt-3 flex flex-wrap gap-1.5"
          id={listId}
        >
          {otherStatuses.map((status) => (
            <li key={status}>
              <button
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-app-surface2 px-3 text-xs font-medium text-app-textSoft ring-1 ring-inset ring-app-border transition hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                onClick={() => {
                  setIsOpen(false);
                  onSelect(status);
                }}
                onKeyDown={handleKeyDown}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${statusSolidClasses[status]}`}
                />
                {t(JOB_STATUS_TRANSLATION_KEYS[status])}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
