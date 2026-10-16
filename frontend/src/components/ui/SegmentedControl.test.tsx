import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('marks the selected option and reports a new choice', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        label="View"
        onChange={handleChange}
        options={[
          { label: 'Table', value: 'table' },
          { label: 'Board', value: 'board' },
        ]}
        value="table"
      />,
    );

    const group = screen.getByRole('group', { name: 'View' });

    expect(within(group).getByRole('button', { name: 'Table' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(group).getByRole('button', { name: 'Board' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(within(group).getByRole('button', { name: 'Board' }));

    expect(handleChange).toHaveBeenCalledWith('board');
  });
});
