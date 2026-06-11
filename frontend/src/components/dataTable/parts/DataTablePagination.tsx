import type { ChangeEventHandler } from 'react';

import { Button, Select } from '../../ui';
import { useTranslation } from '../../../i18n';

/**
 * Props used by the data table pagination controls.
 */
interface IDataTablePaginationProps {
  currentPageIndex: number;
  firstVisibleRow: number;
  lastVisibleRow: number;
  onNextPage: () => void;
  onPageSizeChange: ChangeEventHandler<HTMLSelectElement>;
  onPreviousPage: () => void;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRows: number;
}

/**
 * Renders pagination controls and visible row summary.
 *
 * @param {IDataTablePaginationProps} props Component props.
 * @returns {JSX.Element | null} Data table pagination controls.
 */
export const DataTablePagination = ({
  currentPageIndex,
  firstVisibleRow,
  lastVisibleRow,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  pageCount,
  pageSize,
  pageSizeOptions,
  totalRows,
}: IDataTablePaginationProps) => {
  const { t } = useTranslation();

  if (totalRows === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-app-border bg-app-surface2 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="text-sm text-app-textMuted">
        {t('dataTable.rowsSummary', {
          from: firstVisibleRow,
          to: lastVisibleRow,
          total: totalRows,
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select label={t('dataTable.rowsPerPage')} onChange={onPageSizeChange} value={pageSize}>
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-2">
          <Button disabled={currentPageIndex === 0} onClick={onPreviousPage} variant="secondary">
            {t('dataTable.previousPage')}
          </Button>
          <span className="text-sm text-app-textMuted">
            {t('dataTable.pageSummary', {
              page: currentPageIndex + 1,
              totalPages: pageCount,
            })}
          </span>
          <Button
            disabled={currentPageIndex >= pageCount - 1}
            onClick={onNextPage}
            variant="secondary"
          >
            {t('dataTable.nextPage')}
          </Button>
        </div>
      </div>
    </div>
  );
};
