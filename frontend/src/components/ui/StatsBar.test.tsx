import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { StatsBar } from './StatsBar';

describe('StatsBar', () => {
  it('renders each count under its label in one named group', () => {
    render(
      <StatsBar
        items={[
          { id: 'total', label: 'Total', value: 4 },
          { dotClassName: 'bg-success-500', id: 'done', label: 'Done', value: 3 },
        ]}
        label="Counts"
      />,
    );

    const bar = screen.getByRole('group', { name: 'Counts' });
    const countFor = (label: string) =>
      within(bar).getByText(label).closest('div')?.querySelector('dd')?.textContent;

    expect(countFor('Total')).toBe('4');
    expect(countFor('Done')).toBe('3');
  });

  it('shows a dot only for items that set one', () => {
    render(
      <StatsBar
        items={[
          { id: 'total', label: 'Total', value: 4 },
          { dotClassName: 'bg-success-500', id: 'done', label: 'Done', value: 3 },
        ]}
        label="Counts"
      />,
    );

    expect(screen.getByText('Total').closest('dt')?.querySelector('[aria-hidden]')).toBeNull();
    expect(screen.getByText('Done').closest('dt')?.querySelector('[aria-hidden]')).toHaveClass(
      'bg-success-500',
    );
  });
});
