import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTable } from './DataTable';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { IDataTableColumn } from './dataTable.types';

type TExampleRow = {
  id: string;
  name: string;
  status: string;
};

const rows: TExampleRow[] = [
  {
    id: 'row-001',
    name: 'Beta',
    status: 'Applied',
  },
  {
    id: 'row-002',
    name: 'Alpha',
    status: 'Interview',
  },
  {
    id: 'row-003',
    name: 'Gamma',
    status: 'Offer',
  },
];

const columns: IDataTableColumn<TExampleRow>[] = [
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
    sortLabel: 'Status',
    sortValue: (row) => row.status,
  },
];

const renderExampleTable = () =>
  renderWithProviders(
    <DataTable<TExampleRow>
      caption="Example rows"
      columns={columns}
      data={rows}
      defaultPageSize={2}
      emptyState={{
        description: 'Try another search.',
        title: 'No rows',
      }}
      getRowId={(row) => row.id}
      pageSizeOptions={[2, 5]}
      search={{
        getSearchText: (row) => `${row.name} ${row.status}`,
        label: 'Search rows',
        placeholder: 'Search by name or status',
      }}
      title="Example table"
    />,
  );

const mockMatchMedia = (matches: boolean) => {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }));
};

afterEach(() => {
  mockMatchMedia(true);
});

describe('DataTable', () => {
  it('renders without a header when no header content is configured', () => {
    renderWithProviders(
      <DataTable<TExampleRow>
        caption="Plain rows"
        columns={columns}
        data={rows}
        emptyState={{
          title: 'No rows',
        }}
        getRowId={(row) => row.id}
      />,
    );

    expect(screen.getByRole('table', { name: 'Plain rows' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders actions and custom summary without a title', () => {
    renderWithProviders(
      <DataTable<TExampleRow>
        actions={<button type="button">Add row</button>}
        caption="Action rows"
        columns={columns}
        data={rows}
        emptyState={{
          title: 'No rows',
        }}
        getRowId={(row) => row.id}
        renderSummary={({ shown, total }) => `${shown}/${total} visible`}
      />,
    );

    expect(screen.getByText('3/3 visible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add row' })).toBeInTheDocument();
  });

  it('renders mobile rows when the desktop breakpoint does not match', () => {
    mockMatchMedia(false);

    renderWithProviders(
      <DataTable<TExampleRow>
        caption="Mobile example rows"
        columns={columns}
        data={rows}
        emptyState={{
          title: 'No rows',
        }}
        getRowId={(row) => row.id}
      />,
    );

    expect(screen.getByRole('list', { name: 'Mobile example rows' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders rows and filters them through the accessible search field', async () => {
    const user = userEvent.setup();
    renderExampleTable();

    expect(screen.getByRole('table', { name: 'Example rows' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Beta' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search rows'), 'interview');

    expect(screen.getByRole('rowheader', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Beta' })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search rows'));
    await user.type(screen.getByLabelText('Search rows'), 'missing');

    expect(screen.getByText('No rows')).toBeInTheDocument();
    expect(screen.getByText('Try another search.')).toBeInTheDocument();
  });

  it('sorts rows when a sortable column header is activated', async () => {
    const user = userEvent.setup();
    renderExampleTable();

    await user.click(screen.getByRole('button', { name: 'Sort Name ascending' }));

    expect(
      within(screen.getByRole('table', { name: 'Example rows' }))
        .getAllByRole('rowheader')
        .map((rowHeader) => rowHeader.textContent),
    ).toEqual(['Alpha', 'Beta']);

    await user.click(screen.getByRole('button', { name: 'Sort Name descending' }));

    expect(
      within(screen.getByRole('table', { name: 'Example rows' }))
        .getAllByRole('rowheader')
        .map((rowHeader) => rowHeader.textContent),
    ).toEqual(['Gamma', 'Beta']);
  });

  it('paginates rows using accessible navigation buttons', async () => {
    const user = userEvent.setup();
    renderExampleTable();

    expect(screen.getByText('1-2 of 3 rows')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('3-3 of 3 rows')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Gamma' })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Beta' })).not.toBeInTheDocument();
  });
});
