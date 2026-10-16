import type { ChangeEvent, ChangeEventHandler, ReactNode } from 'react';

import { Input, Select } from '../../ui';
import { SearchIcon } from '../../icons';
import { useTranslation } from '../../../i18n';
import type {
  IDataTableColumn,
  IDataTableSearchConfig,
  TDataTableSortState,
} from '../dataTable.types';

/**
 * Props used by the data table toolbar.
 */
interface IDataTableToolbarProps<TData> {
  /** Sortable columns for the "Sort by" select; leave out for search and filters only. */
  columns?: IDataTableColumn<TData>[];
  filters?: ReactNode;
  onSearchChange: ChangeEventHandler<HTMLInputElement>;
  onSortChange?: (sort: TDataTableSortState) => void;
  search?: IDataTableSearchConfig<TData>;
  searchQuery: string;
  showSortSelect?: boolean;
  sortState?: TDataTableSortState;
}

/** Select value for "no sorting". */
const NO_SORT_VALUE = '';

/**
 * Encodes a sort state as a select option value.
 *
 * @param {TDataTableSortState} sort Sort state.
 * @returns {string} Option value.
 */
const toSortValue = (sort: TDataTableSortState): string =>
  sort ? `${sort.columnId}:${sort.direction}` : NO_SORT_VALUE;

/**
 * Renders search, filter, and optional sort controls in their own card
 * above the data table. The sort select offers both directions of every
 * sortable column, so it always reflects the sort the column headers set.
 * From `lg` up the controls share one row: the first takes the spare
 * width and each further one a 14rem column, so no empty column is left
 * whichever controls are shown.
 *
 * @param {IDataTableToolbarProps<TData>} props Component props.
 * @returns {JSX.Element | null} Data table toolbar.
 */
export const DataTableToolbar = <TData,>({
  columns,
  filters,
  onSearchChange,
  onSortChange,
  search,
  searchQuery,
  showSortSelect = false,
  sortState = null,
}: IDataTableToolbarProps<TData>) => {
  const { t } = useTranslation();
  const sortableColumns = columns?.filter((column) => column.sortValue) ?? [];
  const hasSortSelect = showSortSelect && sortableColumns.length > 0 && Boolean(onSortChange);

  if (!search && !filters && !hasSortSelect) return null;

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const [columnId, direction] = event.target.value.split(':');

    onSortChange?.(
      columnId ? { columnId, direction: direction === 'desc' ? 'desc' : 'asc' } : null,
    );
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm sm:p-5 lg:auto-cols-[14rem] lg:grid-flow-col lg:grid-cols-[minmax(0,1fr)] lg:items-end">
      {search && (
        <Input
          label={search.label}
          leftIcon={<SearchIcon />}
          onChange={onSearchChange}
          placeholder={search.placeholder}
          value={searchQuery}
        />
      )}
      {filters}
      {hasSortSelect && (
        <Select
          label={t('dataTable.sortBy')}
          onChange={handleSortChange}
          value={toSortValue(sortState)}
        >
          <option value={NO_SORT_VALUE}>{t('dataTable.sortNone')}</option>
          {sortableColumns.flatMap((column) => {
            const columnLabel = column.sortLabel ?? String(column.id);

            return (['asc', 'desc'] as const).map((direction) => (
              <option key={`${column.id}:${direction}`} value={`${column.id}:${direction}`}>
                {t(direction === 'asc' ? 'dataTable.sortOptionAsc' : 'dataTable.sortOptionDesc', {
                  column: columnLabel,
                })}
              </option>
            ));
          })}
        </Select>
      )}
    </div>
  );
};
