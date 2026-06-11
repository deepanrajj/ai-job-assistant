import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTableToolbar } from './DataTableToolbar';

describe('DataTableToolbar', () => {
  it('renders nothing when search and filters are missing', () => {
    const { container } = render(
      <DataTableToolbar onSearchChange={() => undefined} searchQuery="" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders search and filter controls', async () => {
    const user = userEvent.setup();
    const handleSearchChange = vi.fn();
    render(
      <DataTableToolbar
        filters={<button type="button">Filter</button>}
        onSearchChange={handleSearchChange}
        search={{
          getSearchText: (row: { name: string }) => row.name,
          label: 'Search rows',
          placeholder: 'Search by name',
        }}
        searchQuery=""
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Search rows' }), 'alpha');

    expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(handleSearchChange).toHaveBeenCalled();
  });
});
