import type {
  IDataTableColumn,
  TDataTableAriaSortValue,
  TDataTableSortDirection,
  TDataTableSortState,
  TDataTableSortValue,
} from './dataTable.types';

/**
 * Normalizes text for case-insensitive table searching.
 *
 * @param {string} value Text value to normalize.
 * @returns {string} Search-ready text.
 */
export const normalizeTableSearchText = (value: string): string => value.trim().toLowerCase();

/**
 * Returns the next sort state when a sortable column header is activated.
 *
 * @param {TDataTableSortState} currentSort Current sort state.
 * @param {string} columnId Activated column id.
 * @returns {TDataTableSortState} Next sort state.
 */
export const getNextDataTableSortState = (
  currentSort: TDataTableSortState,
  columnId: string,
): TDataTableSortState => {
  if (!currentSort || currentSort.columnId !== columnId)
    return {
      columnId,
      direction: 'asc',
    };

  if (currentSort.direction === 'asc')
    return {
      columnId,
      direction: 'desc',
    };

  return null;
};

/**
 * Returns the active sort direction for a table column.
 *
 * @param {TDataTableSortState} sortState Current sort state.
 * @param {string} columnId Column id to inspect.
 * @returns {TDataTableSortDirection | undefined} Active direction when the column is sorted.
 */
export const getDataTableSortDirection = (
  sortState: TDataTableSortState,
  columnId: string,
): TDataTableSortDirection | undefined =>
  sortState?.columnId === columnId ? sortState.direction : undefined;

/**
 * Maps the internal table sort direction to an aria-sort value.
 *
 * @param {TDataTableSortDirection | undefined} sortDirection Active column sort direction.
 * @returns {TDataTableAriaSortValue} Accessible sort value for a table header.
 */
export const getDataTableAriaSort = (
  sortDirection: TDataTableSortDirection | undefined,
): TDataTableAriaSortValue => {
  if (!sortDirection) return 'none';

  return sortDirection === 'asc' ? 'ascending' : 'descending';
};

/**
 * Compares two supported sort values.
 *
 * @param {TDataTableSortValue} first First value.
 * @param {TDataTableSortValue} second Second value.
 * @returns {number} Sort comparison result.
 */
export const compareDataTableSortValues = (
  first: TDataTableSortValue,
  second: TDataTableSortValue,
): number => {
  if (first === second) return 0;
  if (first === null || first === undefined) return 1;
  if (second === null || second === undefined) return -1;

  const firstValue = first instanceof Date ? first.getTime() : first;
  const secondValue = second instanceof Date ? second.getTime() : second;

  if (typeof firstValue === 'number' && typeof secondValue === 'number')
    return firstValue - secondValue;

  return String(firstValue).localeCompare(String(secondValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

/**
 * Sorts rows by the active sortable column.
 *
 * @param {TData[]} rows Rows to sort.
 * @param {IDataTableColumn<TData>[]} columns Table columns.
 * @param {TDataTableSortState} sortState Current sort state.
 * @returns {TData[]} Sorted rows.
 */
export const sortDataTableRows = <TData>(
  rows: TData[],
  columns: IDataTableColumn<TData>[],
  sortState: TDataTableSortState,
): TData[] => {
  if (!sortState) return rows;

  const sortColumn = columns.find((column) => column.id === sortState.columnId);
  const sortValue = sortColumn?.sortValue;

  if (!sortValue) return rows;

  return [...rows].sort((firstRow, secondRow) => {
    const result = compareDataTableSortValues(sortValue(firstRow), sortValue(secondRow));

    return sortState.direction === 'asc' ? result : result * -1;
  });
};

/**
 * Returns the rows shown on the active page.
 *
 * @param {TData[]} rows Rows to paginate.
 * @param {number} pageIndex Zero-based page index.
 * @param {number} pageSize Rows per page.
 * @returns {TData[]} Rows for the active page.
 */
export const paginateDataTableRows = <TData>(
  rows: TData[],
  pageIndex: number,
  pageSize: number,
): TData[] => rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
