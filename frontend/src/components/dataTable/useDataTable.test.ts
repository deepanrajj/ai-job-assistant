import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { describe, expect, it } from 'vitest';

import type { IDataTableColumn } from './dataTable.types';
import { useDataTable } from './useDataTable';

type TRow = {
  id: string;
  name: string;
};

const rows: TRow[] = [
  {
    id: 'row-1',
    name: 'Beta',
  },
  {
    id: 'row-2',
    name: 'Alpha',
  },
  {
    id: 'row-3',
    name: 'Gamma',
  },
];

const columns: IDataTableColumn<TRow>[] = [
  {
    cell: (row) => row.name,
    header: 'Name',
    id: 'name',
    sortValue: (row) => row.name,
  },
];

describe('useDataTable', () => {
  it('stores search, sorting, and pagination state', () => {
    const { result } = renderHook(() =>
      useDataTable<TRow>({
        columns,
        data: rows,
        defaultPageSize: 2,
        initialSort: null,
        search: {
          getSearchText: (row) => row.name,
          label: 'Search',
        },
      }),
    );

    expect(result.current.pageRows.map((row) => row.id)).toEqual(['row-1', 'row-2']);

    act(() => {
      result.current.handleSort('name');
    });

    expect(result.current.pageRows.map((row) => row.id)).toEqual(['row-2', 'row-1']);

    act(() => {
      result.current.handleSearchChange({
        target: {
          value: 'gamma',
        },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.searchQuery).toBe('gamma');
    expect(result.current.pageRows.map((row) => row.id)).toEqual(['row-3']);

    act(() => {
      result.current.handlePageSizeChange({
        target: {
          value: '1',
        },
      } as ChangeEvent<HTMLSelectElement>);
    });

    expect(result.current.pageSize).toBe(1);

    act(() => {
      result.current.handleNextPage();
    });

    expect(result.current.currentPageIndex).toBe(0);

    act(() => {
      result.current.handlePreviousPage();
    });

    expect(result.current.currentPageIndex).toBe(0);
  });
});
