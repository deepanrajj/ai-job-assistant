import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { DataTablePagination } from './DataTablePagination';

describe('DataTablePagination', () => {
  it('renders nothing when there are no rows', () => {
    const { container } = renderWithProviders(
      <DataTablePagination
        currentPageIndex={0}
        firstVisibleRow={0}
        lastVisibleRow={0}
        onNextPage={() => undefined}
        onPageSizeChange={() => undefined}
        onPreviousPage={() => undefined}
        pageCount={1}
        pageSize={5}
        pageSizeOptions={[5, 10]}
        totalRows={0}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders pagination summary and controls', async () => {
    const user = userEvent.setup();
    const handleNextPage = vi.fn();
    const handlePreviousPage = vi.fn();
    const handlePageSizeChange = vi.fn();
    renderWithProviders(
      <DataTablePagination
        currentPageIndex={1}
        firstVisibleRow={6}
        lastVisibleRow={10}
        onNextPage={handleNextPage}
        onPageSizeChange={handlePageSizeChange}
        onPreviousPage={handlePreviousPage}
        pageCount={3}
        pageSize={5}
        pageSizeOptions={[5, 10]}
        totalRows={12}
      />,
    );

    expect(screen.getByText('6-10 of 12 rows')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '10');

    expect(handlePreviousPage).toHaveBeenCalledTimes(1);
    expect(handleNextPage).toHaveBeenCalledTimes(1);
    expect(handlePageSizeChange).toHaveBeenCalledTimes(1);
  });
});
