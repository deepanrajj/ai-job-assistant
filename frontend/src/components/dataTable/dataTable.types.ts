import type { ReactNode } from 'react';

/**
 * Supported table sort directions.
 */
export type TDataTableSortDirection = 'asc' | 'desc';

/**
 * Supported aria-sort values used by sortable table headers.
 */
export type TDataTableAriaSortValue = 'ascending' | 'descending' | 'none';

/**
 * Values that can be compared by the generic table sorter.
 */
export type TDataTableSortValue = Date | number | string | null | undefined;

/**
 * Current table sort state.
 */
export type TDataTableSortState = {
  columnId: string;
  direction: TDataTableSortDirection;
} | null;

/**
 * Column configuration used by the generic data table.
 */
export interface IDataTableColumn<TData> {
  cell: (row: TData) => ReactNode;
  className?: string;
  header: ReactNode;
  headerClassName?: string;
  id: string;
  isRowHeader?: boolean;
  mobileCell?: (row: TData) => ReactNode;
  mobileLabel?: ReactNode;
  sortLabel?: string;
  sortValue?: (row: TData) => TDataTableSortValue;
  widthClassName?: string;
}

/**
 * Search configuration used by the generic data table.
 */
export interface IDataTableSearchConfig<TData> {
  getSearchText: (row: TData) => string;
  label: string;
  placeholder?: string;
}

/**
 * Empty state content shown when no rows match.
 */
export interface IDataTableEmptyState {
  description?: string;
  title: string;
}

/**
 * Summary values exposed by the generic data table.
 */
export interface IDataTableSummaryState {
  from: number;
  page: number;
  pageCount: number;
  shown: number;
  to: number;
  total: number;
}

/**
 * Props used by the generic data table.
 */
export interface IDataTableProps<TData> {
  actions?: ReactNode;
  caption: string;
  columns: IDataTableColumn<TData>[];
  data: TData[];
  defaultPageSize?: number;
  emptyState: IDataTableEmptyState;
  filterPredicate?: (row: TData) => boolean;
  filters?: ReactNode;
  getRowId: (row: TData) => string;
  initialSort?: TDataTableSortState;
  pageSizeOptions?: number[];
  renderSummary?: (state: IDataTableSummaryState) => ReactNode;
  search?: IDataTableSearchConfig<TData>;
  title?: ReactNode;
}
