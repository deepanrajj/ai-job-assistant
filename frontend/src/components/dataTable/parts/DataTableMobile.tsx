import type { ReactNode } from 'react';

import type { IDataTableColumn } from '../dataTable.types';

/**
 * Props used by the mobile data table card list.
 */
interface IDataTableMobileProps<TData> {
  caption: string;
  columns: IDataTableColumn<TData>[];
  getRowId: (row: TData) => string;
  rows: TData[];
}

/**
 * Renders data table rows as stacked cards on small screens.
 *
 * @param {IDataTableMobileProps<TData>} props Component props.
 * @returns {JSX.Element} Mobile data table cards.
 */
export const DataTableMobile = <TData,>({
  caption,
  columns,
  getRowId,
  rows,
}: IDataTableMobileProps<TData>) => (
  <ul className="space-y-3 p-4" aria-label={caption}>
    {rows.map((row) => (
      <li className="rounded-lg border border-app-border bg-app-surface p-4" key={getRowId(row)}>
        <dl className="space-y-3">
          {columns.map((column) => (
            <div
              className="border-b border-app-borderSoft pb-3 last:border-0 last:pb-0"
              key={column.id}
            >
              <dt className="text-xs font-semibold uppercase text-app-textMuted">
                {column.mobileLabel ?? column.header}
              </dt>
              <dd className="mt-1 text-sm text-app-textSoft">
                {(column.mobileCell?.(row) ?? column.cell(row)) as ReactNode}
              </dd>
            </div>
          ))}
        </dl>
      </li>
    ))}
  </ul>
);
