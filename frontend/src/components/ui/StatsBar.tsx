import { memo, type FC, type ReactNode } from 'react';

/**
 * One count in the stats bar.
 */
export interface IStatsBarItem {
  /** Extra classes for the cell, such as a column span. */
  className?: string;
  /** Background class of the coloured dot before the label; no dot when left out. */
  dotClassName?: string;
  id: string;
  label: string;
  value: ReactNode;
}

/**
 * Props used by the stats bar.
 */
interface IStatsBarProps {
  /** Grid column classes, such as `sm:grid-cols-3`. */
  className?: string;
  items: IStatsBarItem[];
  /** Accessible name of the bar. */
  label: string;
}

/**
 * Renders counts as one bar split by thin dividers, each a label over its
 * value. On phones every cell lays its label and value side by side; from
 * `sm` up they stack. The dividers are the bar's background showing
 * through a 1px grid gap, so the caller sets the columns.
 *
 * @param {IStatsBarProps} props Component props.
 * @returns {JSX.Element} Stats bar.
 */
const StatsBarComponent: FC<IStatsBarProps> = ({ className = '', items, label }) => (
  <dl
    // A dl has no role of its own, so the group carries the name.
    aria-label={label}
    role="group"
    className={`grid gap-px overflow-hidden rounded-2xl border border-app-border bg-app-border shadow-sm ${className}`}
  >
    {items.map((item) => (
      <div
        className={`flex items-center justify-between gap-3 bg-app-surface px-4 py-3 sm:block sm:py-4 ${item.className ?? ''}`}
        key={item.id}
      >
        <dt className="flex min-w-0 items-center gap-2 text-sm font-medium text-app-textMuted">
          {item.dotClassName && (
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClassName}`}
            />
          )}
          <span className="truncate">{item.label}</span>
        </dt>
        <dd className="text-2xl font-semibold text-app-text sm:mt-1">{item.value}</dd>
      </div>
    ))}
  </dl>
);

export const StatsBar = memo(StatsBarComponent);
