import { memo, type FC } from 'react';

import type { TDataTableSortDirection } from './dataTable.types';

/**
 * Props used by the data table sort icon.
 */
interface IDataTableSortIconProps {
  className?: string;
  direction?: TDataTableSortDirection;
}

/**
 * Renders the decorative icon that identifies sortable table columns.
 *
 * @param {IDataTableSortIconProps} props Component props.
 * @param {string} props.className Optional SVG class name.
 * @param {TDataTableSortDirection} props.direction Active sort direction.
 * @returns {JSX.Element} Sort icon.
 */
const DataTableSortIconComponent: FC<IDataTableSortIconProps> = ({
  className = 'h-3.5 w-3.5',
  direction,
}) => {
  const isAscending = direction === 'asc';

  return (
    <svg aria-hidden="true" className={className} fill="none" focusable="false" viewBox="0 0 20 20">
      {direction ? (
        <path
          d={
            isAscending
              ? 'M10 16V4M5.75 8.25 10 4l4.25 4.25'
              : 'M10 4v12m4.25-4.25L10 16l-4.25-4.25'
          }
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      ) : (
        <>
          <path
            d="M10 4v12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M6.75 7.25 10 4l3.25 3.25M13.25 12.75 10 16l-3.25-3.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </>
      )}
    </svg>
  );
};

export const DataTableSortIcon = memo(DataTableSortIconComponent);
