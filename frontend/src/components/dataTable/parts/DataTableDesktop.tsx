import { useCallback } from 'react';

import { DataTableSortIcon } from '../dataTable.icons';
import { useTranslation } from '../../../i18n';
import {
  getDataTableAriaSort,
  getDataTableSortDirection,
  getNextDataTableSortState,
} from '../dataTable.utils';
import { classNames } from '../../../utils';
import type { IDataTableColumn, TDataTableSortState } from '../dataTable.types';

/**
 * Props used by the desktop data table.
 */
interface IDataTableDesktopProps<TData> {
  caption: string;
  columns: IDataTableColumn<TData>[];
  getRowId: (row: TData) => string;
  onSort: (columnId: string) => void;
  rows: TData[];
  sortState: TDataTableSortState;
}

/**
 * Renders data table rows as a semantic table on medium and larger screens.
 *
 * @param {IDataTableDesktopProps<TData>} props Component props.
 * @returns {JSX.Element} Desktop data table.
 */
export const DataTableDesktop = <TData,>({
  caption,
  columns,
  getRowId,
  onSort,
  rows,
  sortState,
}: IDataTableDesktopProps<TData>) => {
  const { t } = useTranslation();
  const getSortLabel = useCallback(
    (column: IDataTableColumn<TData>) => {
      const columnLabel = column.sortLabel ?? String(column.id);
      const nextSort = getNextDataTableSortState(sortState, column.id);

      if (!nextSort) return t('dataTable.clearSort', { column: columnLabel });

      return nextSort.direction === 'desc'
        ? t('dataTable.sortDescending', { column: columnLabel })
        : t('dataTable.sortAscending', { column: columnLabel });
    },
    [sortState, t],
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] table-fixed divide-y divide-app-border lg:min-w-full">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {columns.map((column) => (
            <col className={column.widthClassName} key={column.id} />
          ))}
        </colgroup>
        <thead className="bg-app-surface2">
          <tr>
            {columns.map((column) => {
              const sortDirection = getDataTableSortDirection(sortState, column.id);
              const isSorted = Boolean(sortDirection);

              return (
                <th
                  aria-sort={column.sortValue ? getDataTableAriaSort(sortDirection) : undefined}
                  className={classNames(
                    'px-4 py-3 text-left text-xs font-semibold uppercase text-app-textMuted',
                    column.headerClassName,
                  )}
                  key={column.id}
                  scope="col"
                >
                  {column.sortValue ? (
                    <button
                      aria-label={getSortLabel(column)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded text-left uppercase hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface2"
                      onClick={() => onSort(column.id)}
                      type="button"
                    >
                      <span>{column.header}</span>
                      <DataTableSortIcon
                        className={classNames(
                          'h-3.5 w-3.5',
                          isSorted ? 'text-primary-700' : 'text-app-textMuted',
                        )}
                        direction={sortDirection}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-app-border bg-app-surface">
          {rows.map((row) => (
            <tr key={getRowId(row)} className="hover:bg-app-surface2">
              {columns.map((column) => {
                const CellElement = column.isRowHeader ? 'th' : 'td';

                return (
                  <CellElement
                    className={classNames('px-4 py-4 align-top', column.className)}
                    key={column.id}
                    scope={column.isRowHeader ? 'row' : undefined}
                  >
                    {column.cell(row)}
                  </CellElement>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
