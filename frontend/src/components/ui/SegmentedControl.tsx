import type { ReactNode } from 'react';

import { getSegmentClassName } from './ui.utils';

/**
 * One option of the segmented control.
 */
export interface ISegmentedControlOption<TValue extends string> {
  icon?: ReactNode;
  label: string;
  value: TValue;
}

/**
 * Props used by the segmented control.
 */
interface ISegmentedControlProps<TValue extends string> {
  /** Accessible name of the group, such as "Jobs view". */
  label: string;
  onChange: (value: TValue) => void;
  options: ISegmentedControlOption<TValue>[];
  value: TValue;
}

/**
 * Renders a pill-shaped switch between views: a named group of buttons,
 * the selected one marked with `aria-pressed`.
 *
 * @param {ISegmentedControlProps<TValue>} props Component props.
 * @returns {JSX.Element} Segmented control.
 */
export const SegmentedControl = <TValue extends string>({
  label,
  onChange,
  options,
  value,
}: ISegmentedControlProps<TValue>) => (
  <div
    aria-label={label}
    className="inline-flex w-fit shrink-0 rounded-full border border-app-border bg-app-surface2 p-1"
    role="group"
  >
    {options.map((option) => (
      <button
        aria-pressed={value === option.value}
        className={getSegmentClassName(value === option.value)}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.icon}
        {option.label}
      </button>
    ))}
  </div>
);
