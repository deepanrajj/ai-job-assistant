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
 * Renders a column's mobile content, falling back to its table cell.
 *
 * @param {IDataTableColumn<TData>} column Column to render.
 * @param {TData} row Row to render it for.
 * @returns {ReactNode} Cell content.
 */
const renderMobileCell = <TData,>(column: IDataTableColumn<TData>, row: TData): ReactNode =>
  (column.mobileCell?.(row) ?? column.cell(row)) as ReactNode;

/**
 * Renders data table rows as stacked cards on small screens. Columns marked
 * `mobileHeading` lead each card without labels; every other column follows
 * as a labelled field, so no column is dropped.
 *
 * @param {IDataTableMobileProps<TData>} props Component props.
 * @returns {JSX.Element} Mobile data table cards.
 */
export const DataTableMobile = <TData,>({
  caption,
  columns,
  getRowId,
  rows,
}: IDataTableMobileProps<TData>) => {
  const headingColumns = columns.filter((column) => column.mobileHeading);
  const fieldColumns = columns.filter((column) => !column.mobileHeading);

  return (
    <ul className="space-y-3 p-4" aria-label={caption}>
      {rows.map((row) => (
        <li
          className="rounded-xl border border-app-border bg-app-surface p-4 shadow-sm"
          key={getRowId(row)}
        >
          {headingColumns.length > 0 && (
            <div className="mb-3 space-y-1.5 border-b border-app-borderSoft pb-3">
              {headingColumns.map((column) => (
                <div key={column.id}>{renderMobileCell(column, row)}</div>
              ))}
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fieldColumns.map((column) => (
              <div className="min-w-0" key={column.id}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-app-textMuted">
                  {column.mobileLabel ?? column.header}
                </dt>
                <dd className="mt-1 text-sm text-app-textSoft">{renderMobileCell(column, row)}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
};
