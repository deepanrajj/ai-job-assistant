import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTableDesktop } from './DataTableDesktop';
import { renderWithProviders } from '../../../test/renderWithProviders';
import type { IDataTableColumn } from '../dataTable.types';

type TRow = {
  id: string;
  name: string;
  status: string;
};

const rows: TRow[] = [
  {
    id: 'row-1',
    name: 'Alpha',
    status: 'Applied',
  },
];

const columns: IDataTableColumn<TRow>[] = [
  {
    cell: (row) => row.name,
    header: 'Name',
    id: 'name',
    isRowHeader: true,
    sortLabel: 'Name',
    sortValue: (row) => row.name,
  },
  {
    cell: (row) => row.status,
    header: 'Status',
    id: 'status',
  },
];

describe('DataTableDesktop', () => {
  it('builds fallback and clear sort labels for sortable columns', () => {
    renderWithProviders(
      <DataTableDesktop<TRow>
        caption="Clear sort rows"
        columns={[
          {
            cell: (row) => row.name,
            header: 'Name',
            id: 'name',
            sortValue: (row) => row.name,
          },
        ]}
        getRowId={(row) => row.id}
        onSort={() => undefined}
        rows={rows}
        sortState={{
          columnId: 'name',
          direction: 'desc',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Clear name sorting' })).toBeInTheDocument();
  });

  it('renders a semantic table and calls sorting for sortable columns', async () => {
    const user = userEvent.setup();
    const handleSort = vi.fn();
    renderWithProviders(
      <DataTableDesktop<TRow>
        caption="Desktop rows"
        columns={columns}
        getRowId={(row) => row.id}
        onSort={handleSort}
        rows={rows}
        sortState={{
          columnId: 'name',
          direction: 'asc',
        }}
      />,
    );

    const table = screen.getByRole('table', { name: 'Desktop rows' });

    expect(within(table).getByRole('rowheader', { name: 'Alpha' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(within(table).getByRole('columnheader', { name: 'Status' })).not.toHaveAttribute(
      'aria-sort',
    );

    await user.click(screen.getByRole('button', { name: 'Sort Name descending' }));

    expect(handleSort).toHaveBeenCalledWith('name');
  });
});
