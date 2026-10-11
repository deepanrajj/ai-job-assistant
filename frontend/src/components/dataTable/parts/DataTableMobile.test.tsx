import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { DataTableMobile } from './DataTableMobile';
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

  it('leads each card with heading columns, unlabelled, and keeps every other field', () => {
    renderWithProviders(
      <DataTableMobile<TRow>
        caption="Mobile rows"
        columns={[{ ...columns[0], mobileHeading: true }, columns[1]]}
        getRowId={(row) => row.id}
        rows={rows}
      />,
    );

    const card = screen.getByRole('listitem');

    expect(within(card).getByText('Alpha')).toBeInTheDocument();
    expect(within(card).queryByText('Company')).not.toBeInTheDocument();
    expect(within(card).getByText('Status')).toBeInTheDocument();
    expect(within(card).getByText('Status: Applied')).toBeInTheDocument();
  });
});
