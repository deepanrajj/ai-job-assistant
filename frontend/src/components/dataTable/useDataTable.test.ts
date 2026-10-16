import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';

import { useDataTable } from './useDataTable';
import type { IDataTableColumn } from './dataTable.types';

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
  it('goes back to the first page when the filter value changes', () => {
    const { rerender, result } = renderHook(
      ({ filterKey }) =>
        useDataTable<TRow>({
          columns,
          data: rows,
          defaultPageSize: 1,
          // A new function every render must not reset the page on its own.
          filterPredicate: (row) => filterKey === 'all' || row.name !== 'Beta',
          filterKey,
          initialSort: null,
        }),
      { initialProps: { filterKey: 'all' } },
    );

    act(() => {
      result.current.handleNextPage();
    });
    rerender({ filterKey: 'all' });
    expect(result.current.currentPageIndex).toBe(1);

    rerender({ filterKey: 'noBeta' });
    expect(result.current.currentPageIndex).toBe(0);
  });

  it('steps back from the page shown after the rows shrink', () => {
    const { rerender, result } = renderHook(
      ({ data }) =>
        useDataTable<TRow>({
          columns,
          data,
          defaultPageSize: 1,
          initialSort: null,
        }),
      { initialProps: { data: rows } },
    );

    act(() => {
      result.current.handleNextPage();
    });
    act(() => {
      result.current.handleNextPage();
    });
    expect(result.current.currentPageIndex).toBe(2);

    // Two rows left: the third page is gone, so page 2 is shown.
    rerender({ data: rows.slice(0, 2) });
    expect(result.current.currentPageIndex).toBe(1);

    act(() => {
      result.current.handlePreviousPage();
    });
    expect(result.current.currentPageIndex).toBe(0);
  });

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
