import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tooltip } from './Tooltip';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('Tooltip', () => {
  it('shows tooltip content on hover', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Tooltip content="Edit job">
        <button type="button">Edit</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('tooltip')).toHaveTextContent('Edit job');
  });

  it('shows tooltip content on keyboard focus', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Tooltip content="Delete job">
        <button type="button">Delete</button>
      </Tooltip>,
    );

    await user.tab();

    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete job');
  });

  it('hides tooltip content when the trigger is no longer active', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Tooltip content="Open posting">
        <button type="button">Open</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.hover(trigger);
    await user.unhover(trigger);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
