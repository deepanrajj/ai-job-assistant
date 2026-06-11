import { useCallback, useMemo, useState, type ChangeEvent, type ChangeEventHandler } from 'react';

import {
  getNextDataTableSortState,
  normalizeTableSearchText,
  paginateDataTableRows,
  sortDataTableRows,
} from './dataTable.utils';
import type {
  IDataTableColumn,
  IDataTableSearchConfig,
  IDataTableSummaryState,
  TDataTableSortState,
} from './dataTable.types';

/**
 * Options used to configure generic data table state.
 */
interface IUseDataTableOptions<TData> {
  columns: IDataTableColumn<TData>[];
  data: TData[];
  defaultPageSize: number;
  filterPredicate?: (row: TData) => boolean;
  initialSort: TDataTableSortState;
  search?: IDataTableSearchConfig<TData>;
}

/**
 * Derived state and handlers returned by the generic data table hook.
 */
interface IUseDataTableResult<TData> {
  currentPageIndex: number;
  firstVisibleRow: number;
  handleNextPage: () => void;
  handlePageSizeChange: ChangeEventHandler<HTMLSelectElement>;
  handlePreviousPage: () => void;
  handleSearchChange: ChangeEventHandler<HTMLInputElement>;
  handleSort: (columnId: string) => void;
  lastVisibleRow: number;
  pageCount: number;
  pageRows: TData[];
  pageSize: number;
  searchQuery: string;
  sortState: TDataTableSortState;
  sortedRows: TData[];
  summaryState: IDataTableSummaryState;
}

/**
 * Stores filtering, sorting, pagination, and derived row state for DataTable.
 *
 * @param {IUseDataTableOptions<TData>} options Table behavior options.
 * @returns {IUseDataTableResult<TData>} Derived table state and event handlers.
 */
export const useDataTable = <TData>({
  columns,
  data,
  defaultPageSize,
  filterPredicate,
  initialSort,
  search,
}: IUseDataTableOptions<TData>): IUseDataTableResult<TData> => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<TDataTableSortState>(initialSort);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const normalizedSearchQuery = normalizeTableSearchText(searchQuery);

  const filteredRows = useMemo(() => {
    const filteredByControls = filterPredicate ? data.filter(filterPredicate) : data;

    if (!search || !normalizedSearchQuery) return filteredByControls;

    return filteredByControls.filter((row) =>
      normalizeTableSearchText(search.getSearchText(row)).includes(normalizedSearchQuery),
    );
  }, [data, filterPredicate, normalizedSearchQuery, search]);

  const sortedRows = useMemo(
    () => sortDataTableRows(filteredRows, columns, sortState),
    [columns, filteredRows, sortState],
  );
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = useMemo(
    () => paginateDataTableRows(sortedRows, currentPageIndex, pageSize),
    [currentPageIndex, pageSize, sortedRows],
  );
  const firstVisibleRow = sortedRows.length === 0 ? 0 : currentPageIndex * pageSize + 1;
  const lastVisibleRow = Math.min(sortedRows.length, (currentPageIndex + 1) * pageSize);
  const summaryState: IDataTableSummaryState = {
    from: firstVisibleRow,
    page: currentPageIndex + 1,
    pageCount,
    shown: sortedRows.length,
    to: lastVisibleRow,
    total: data.length,
  };

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPageIndex(0);
  }, []);

  const handlePageSizeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setPageIndex(0);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPageIndex((currentPageIndex) => Math.max(0, currentPageIndex - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPageIndex((currentPageIndex) => Math.min(pageCount - 1, currentPageIndex + 1));
  }, [pageCount]);

  const handleSort = useCallback((columnId: string) => {
    setSortState((currentSort) => getNextDataTableSortState(currentSort, columnId));
    setPageIndex(0);
  }, []);

  return {
    currentPageIndex,
    firstVisibleRow,
    handleNextPage,
    handlePageSizeChange,
    handlePreviousPage,
    handleSearchChange,
    handleSort,
    lastVisibleRow,
    pageCount,
    pageRows,
    pageSize,
    searchQuery,
    sortState,
    sortedRows,
    summaryState,
  };
};
