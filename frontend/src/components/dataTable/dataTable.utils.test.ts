import { describe, expect, it } from 'vitest';

import {
  compareDataTableSortValues,
  getDataTableAriaSort,
  getDataTableSortDirection,
  getNextDataTableSortState,
  normalizeTableSearchText,
  paginateDataTableRows,
  sortDataTableRows,
} from './dataTable.utils';
import type { IDataTableColumn } from './dataTable.types';

type TRow = {
  id: string;
  name: string | null;
  score: number;
};

const rows: TRow[] = [
  {
    id: '2',
    name: 'Beta',
    score: 20,
  },
  {
    id: '1',
    name: 'Alpha',
    score: 10,
  },
  {
    id: '3',
    name: null,
    score: 30,
  },
];

const columns: IDataTableColumn<TRow>[] = [
  {
    cell: (row) => row.name,
    header: 'Name',
    id: 'name',
    sortValue: (row) => row.name,
  },
  {
    cell: (row) => row.score,
    header: 'Score',
    id: 'score',
    sortValue: (row) => row.score,
  },
];

describe('dataTable utils', () => {
  it('normalizes search text', () => {
    expect(normalizeTableSearchText('  React Role  ')).toBe('react role');
  });

  it('cycles sort state through ascending, descending, and unsorted', () => {
    expect(getNextDataTableSortState(null, 'name')).toEqual({
      columnId: 'name',
      direction: 'asc',
    });
    expect(getNextDataTableSortState({ columnId: 'name', direction: 'asc' }, 'name')).toEqual({
      columnId: 'name',
      direction: 'desc',
    });
    expect(getNextDataTableSortState({ columnId: 'name', direction: 'desc' }, 'name')).toBeNull();
  });

  it('maps sort direction to active direction and aria-sort values', () => {
    expect(getDataTableSortDirection({ columnId: 'name', direction: 'asc' }, 'name')).toBe('asc');
    expect(getDataTableSortDirection({ columnId: 'name', direction: 'asc' }, 'score')).toBe(
      undefined,
    );
    expect(getDataTableAriaSort(undefined)).toBe('none');
    expect(getDataTableAriaSort('asc')).toBe('ascending');
    expect(getDataTableAriaSort('desc')).toBe('descending');
  });

  it('compares supported sort values', () => {
    expect(compareDataTableSortValues('Alpha', 'Alpha')).toBe(0);
    expect(compareDataTableSortValues(1, 2)).toBeLessThan(0);
    expect(compareDataTableSortValues('Job 2', 'Job 10')).toBeLessThan(0);
    expect(compareDataTableSortValues(null, 'Alpha')).toBeGreaterThan(0);
    expect(compareDataTableSortValues('Alpha', undefined)).toBeLessThan(0);
    expect(compareDataTableSortValues(new Date('2026-01-01'), new Date('2026-01-02'))).toBeLessThan(
      0,
    );
  });

  it('sorts and paginates table rows', () => {
    expect(
      sortDataTableRows(rows, columns, { columnId: 'name', direction: 'asc' }).map((row) => row.id),
    ).toEqual(['1', '2', '3']);
    expect(
      sortDataTableRows(rows, columns, { columnId: 'score', direction: 'desc' }).map(
        (row) => row.id,
      ),
    ).toEqual(['3', '2', '1']);
    expect(sortDataTableRows(rows, columns, null)).toBe(rows);
    expect(sortDataTableRows(rows, columns, { columnId: 'missing', direction: 'asc' })).toBe(rows);
    expect(paginateDataTableRows(rows, 1, 2).map((row) => row.id)).toEqual(['3']);
  });
});
