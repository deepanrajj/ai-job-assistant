import { useId } from 'react';

import { EmptyState } from '../ui';
import { DataTableDesktop, DataTableMobile, DataTablePagination, DataTableToolbar } from './parts';
import { useBreakpoint } from '../../hooks';
import { useDataTable } from './useDataTable';
import { DEFAULT_PAGE_SIZE_OPTIONS } from './dataTable.constants';
import type { IDataTableProps } from './dataTable.types';

/**
 * Renders a reusable searchable, sortable, responsive, paginated data table:
 * search, filters, and sorting in a toolbar card, then a card holding the
 * title, summary, actions, rows, and paging.
 *
 * @param {IDataTableProps<TData>} props Component props.
 * @returns {JSX.Element} Generic data table.
 */
export const DataTable = <TData,>({
  actions,
  caption,
  columns,
  data,
  defaultPageSize = DEFAULT_PAGE_SIZE_OPTIONS[0],
  emptyState,
  filterPredicate,
  filters,
  getRowId,
  initialSort = null,
  onSearchQueryChange,
  onSortStateChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  renderSummary,
  search,
  searchQuery,
  showSortSelect = false,
  sortState,
  title,
}: IDataTableProps<TData>) => {
  const titleId = useId();
  const isDesktopLayout = useBreakpoint('md');
  const table = useDataTable({
    columns,
    data,
    defaultPageSize,
    filterPredicate,
    initialSort,
    onSearchQueryChange,
    onSortStateChange,
    search,
    searchQuery,
    sortState,
  });
  const hasHeader = Boolean(title || actions || renderSummary);

  return (
    <section aria-labelledby={title ? titleId : undefined} className="space-y-4">
      <DataTableToolbar
        columns={columns}
        filters={filters}
        onSearchChange={table.handleSearchChange}
        onSortChange={table.handleSortChange}
        search={search}
        searchQuery={table.searchQuery}
        showSortSelect={showSortSelect}
        sortState={table.sortState}
      />

      <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
        {hasHeader && (
          <div className="flex flex-col gap-3 border-b border-app-borderSoft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h2 className="font-display text-xl font-semibold text-app-text" id={titleId}>
                  {title}
                </h2>
              )}
              {renderSummary && (
                <p className="mt-1 text-sm text-app-textMuted">
                  {renderSummary(table.summaryState)}
                </p>
              )}
            </div>
            {actions}
          </div>
        )}

        {table.pageRows.length > 0 ? (
          isDesktopLayout ? (
            <DataTableDesktop
              caption={caption}
              columns={columns}
              getRowId={getRowId}
              onSort={table.handleSort}
              rows={table.pageRows}
              sortState={table.sortState}
            />
          ) : (
            <DataTableMobile
              caption={caption}
              columns={columns}
              getRowId={getRowId}
              rows={table.pageRows}
            />
          )
        ) : (
          <EmptyState
            action={emptyState.action}
            description={emptyState.description}
            title={emptyState.title}
          />
        )}

        <DataTablePagination
          currentPageIndex={table.currentPageIndex}
          firstVisibleRow={table.firstVisibleRow}
          lastVisibleRow={table.lastVisibleRow}
          onNextPage={table.handleNextPage}
          onPageSizeChange={table.handlePageSizeChange}
          onPreviousPage={table.handlePreviousPage}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          pageSizeOptions={pageSizeOptions}
          totalRows={table.sortedRows.length}
        />
      </div>
    </section>
  );
};
