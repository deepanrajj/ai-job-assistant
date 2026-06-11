import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import type { IDataTableColumn } from '../dataTable.types';
import { DataTableMobile } from './DataTableMobile';

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
    mobileLabel: 'Company',
  },
  {
    cell: (row) => row.status,
    header: 'Status',
    id: 'status',
    mobileCell: (row) => `Status: ${row.status}`,
  },
];

describe('DataTableMobile', () => {
  it('renders rows as labeled mobile cards', () => {
    renderWithProviders(
      <DataTableMobile<TRow>
        caption="Mobile rows"
        columns={columns}
        getRowId={(row) => row.id}
        rows={rows}
      />,
    );

    const list = screen.getByRole('list', { name: 'Mobile rows' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Status: Applied')).toBeInTheDocument();
  });
});
