import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTableToolbar } from './DataTableToolbar';
import { renderWithProviders } from '../../../test/renderWithProviders';
import type { IDataTableColumn } from '../dataTable.types';

type TRow = { name: string };

const columns: IDataTableColumn<TRow>[] = [
  {
    cell: (row) => row.name,
    header: 'Name',
    id: 'name',
    sortLabel: 'Name',
    sortValue: (row) => row.name,
  },
  { cell: () => null, header: 'Actions', id: 'actions' },
];

const baseProps = {
  columns,
  onSearchChange: () => undefined,
  onSortChange: () => undefined,
  searchQuery: '',
  showSortSelect: false,
  sortState: null,
};

describe('DataTableToolbar', () => {
  it('renders nothing when search, filters, and sorting are missing', () => {
    const { container } = renderWithProviders(<DataTableToolbar<TRow> {...baseProps} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders search and filter controls', async () => {
    const user = userEvent.setup();
    const handleSearchChange = vi.fn();
    renderWithProviders(
      <DataTableToolbar<TRow>
        {...baseProps}
        filters={<button type="button">Filter</button>}
        onSearchChange={handleSearchChange}
        search={{
          getSearchText: (row) => row.name,
          label: 'Search rows',
          placeholder: 'Search by name',
        }}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Search rows' }), 'alpha');

    expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(handleSearchChange).toHaveBeenCalled();
  });

  it('offers both directions of every sortable column, reflecting and changing the sort', async () => {
    const user = userEvent.setup();
    const handleSortChange = vi.fn();
    renderWithProviders(
      <DataTableToolbar<TRow>
        {...baseProps}
        onSortChange={handleSortChange}
        showSortSelect
        sortState={{ columnId: 'name', direction: 'desc' }}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Sort by' });

    expect(select).toHaveValue('name:desc');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Default order',
      'Name, ascending',
      'Name, descending',
    ]);

    await user.selectOptions(select, 'name:asc');
    expect(handleSortChange).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'asc' });

    await user.selectOptions(select, '');
    expect(handleSortChange).toHaveBeenLastCalledWith(null);
  });
});
