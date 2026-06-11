import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { DataTableSortIcon } from './dataTable.icons';

describe('DataTableSortIcon', () => {
  it('renders a decorative sort icon for sorted and unsorted states', () => {
    const { container, rerender } = render(<DataTableSortIcon />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(<DataTableSortIcon direction="asc" />);
    expect(container.querySelector('svg path')).toHaveAttribute('d', expect.stringContaining('V4'));

    rerender(<DataTableSortIcon direction="desc" />);
    expect(container.querySelector('svg path')).toHaveAttribute(
      'd',
      expect.stringContaining('v12'),
    );
  });
});
