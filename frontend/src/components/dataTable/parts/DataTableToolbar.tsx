import type { ChangeEventHandler, ReactNode } from 'react';

import { Input } from '../../ui';
import { SearchIcon } from '../../icons';
import type { IDataTableSearchConfig } from '../dataTable.types';

/**
 * Props used by the data table toolbar.
 */
interface IDataTableToolbarProps<TData> {
  filters?: ReactNode;
  onSearchChange: ChangeEventHandler<HTMLInputElement>;
  search?: IDataTableSearchConfig<TData>;
  searchQuery: string;
}

/**
 * Renders search and filter controls above the data table.
 *
 * @param {IDataTableToolbarProps<TData>} props Component props.
 * @returns {JSX.Element | null} Data table toolbar.
 */
export const DataTableToolbar = <TData,>({
  filters,
  onSearchChange,
  search,
  searchQuery,
}: IDataTableToolbarProps<TData>) => {
  if (!search && !filters) return null;

  return (
    <div className="grid gap-3 border-b border-app-border bg-app-surface2 p-4 lg:grid-cols-[1fr_auto]">
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
    </div>
  );
};
