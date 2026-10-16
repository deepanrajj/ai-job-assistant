import { useCallback, useMemo, useState, type ChangeEvent, type ChangeEventHandler } from 'react';

import {
  filterDataTableRows,
  getNextDataTableSortState,
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
  /**
   * The filter's current value, such as the selected status. When it
   * changes, paging returns to the first page, as it does for a new
   * search. A plain value rather than the predicate, whose identity can
   * change on every render.
   *
   * It must change whenever `filterPredicate` would match different rows:
   * a predicate that reads two values needs both in the key, such as
   * `${status}|${owner}`. A value left out keeps the current page, clamped
   * to the last one, instead of returning to the first.
   */
  filterKey?: string;
  initialSort: TDataTableSortState;
  onSearchQueryChange?: (searchQuery: string) => void;
  onSortStateChange?: (sortState: TDataTableSortState) => void;
  search?: IDataTableSearchConfig<TData>;
  /** Controlled search text; the hook keeps its own when omitted. */
  searchQuery?: string;
  /** Controlled sort; the hook keeps its own when omitted. */
  sortState?: TDataTableSortState;
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
  handleSortChange: (sort: TDataTableSortState) => void;
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
  filterKey,
  initialSort,
  onSearchQueryChange,
  onSortStateChange,
  search,
  searchQuery: controlledSearchQuery,
  sortState: controlledSortState,
}: IUseDataTableOptions<TData>): IUseDataTableResult<TData> => {
  const [ownSearchQuery, setOwnSearchQuery] = useState('');
  const [ownSortState, setOwnSortState] = useState<TDataTableSortState>(initialSort);
  const searchQuery = controlledSearchQuery ?? ownSearchQuery;
  const sortState = controlledSortState === undefined ? ownSortState : controlledSortState;
  const setSearchQuery = onSearchQueryChange ?? setOwnSearchQuery;
  const setSortState = onSortStateChange ?? setOwnSortState;
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const [pagedFilterKey, setPagedFilterKey] = useState(filterKey);

  // A new filter value starts again from the first page. Adjusted during
  // render, React's pattern for resetting state on a prop change; a string
  // compares by value, so this runs only when the filter really changes.
  if (pagedFilterKey !== filterKey) {
    setPagedFilterKey(filterKey);
    setPageIndex(0);
  }
  const filteredRows = useMemo(
    () => filterDataTableRows(data, { filterPredicate, search, searchQuery }),
    [data, filterPredicate, search, searchQuery],
  );

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

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
      setPageIndex(0);
    },
    [setSearchQuery],
  );

  const handlePageSizeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setPageIndex(0);
  }, []);

  // Steps from the page shown, not the stored index, which can sit past
  // the last page after the rows shrink.
  const handlePreviousPage = useCallback(() => {
    setPageIndex(Math.max(0, currentPageIndex - 1));
  }, [currentPageIndex]);

  const handleNextPage = useCallback(() => {
    setPageIndex(Math.min(pageCount - 1, currentPageIndex + 1));
  }, [currentPageIndex, pageCount]);

  const handleSort = useCallback(
    (columnId: string) => {
      setSortState(getNextDataTableSortState(sortState, columnId));
      setPageIndex(0);
    },
    [setSortState, sortState],
  );

  const handleSortChange = useCallback(
    (sort: TDataTableSortState) => {
      setSortState(sort);
      setPageIndex(0);
    },
    [setSortState],
  );

  return {
    currentPageIndex,
    firstVisibleRow,
    handleNextPage,
    handlePageSizeChange,
    handlePreviousPage,
    handleSearchChange,
    handleSort,
    handleSortChange,
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
