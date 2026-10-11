import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobStatusMenu } from './JobStatusMenu';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('JobStatusMenu', () => {
  it('opens a list of the other statuses and moves focus into it', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JobStatusMenu company="Celonis" currentStatus="APPLIED" onSelect={() => {}} />,
    );

    const toggle = screen.getByRole('button', { name: 'Applied, change status for Celonis' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).not.toHaveAttribute('aria-controls');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(toggle.getAttribute('aria-controls') ?? '')).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'Statuses to move Celonis to' });
    const options = within(list).getAllByRole('button');

    expect(options.map((option) => option.textContent)).toEqual([
      'Wishlist',
      'Interview',
      'Offer',
      'Rejected',
      'Withdrawn',
    ]);
    expect(options[0]).toHaveFocus();
  });

  it('selects a status with the keyboard and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <JobStatusMenu company="Celonis" currentStatus="APPLIED" onSelect={onSelect} />,
    );

    screen.getByRole('button', { name: 'Applied, change status for Celonis' }).focus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith('INTERVIEW');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('closes on Escape, returning focus to the pill, and on a press outside', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <JobStatusMenu company="Celonis" currentStatus="APPLIED" onSelect={() => {}} />
        <p>Outside</p>
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'Applied, change status for Celonis' });

    await user.click(toggle);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();

    await user.click(toggle);
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('focuses its status pill on mount when asked, once', () => {
    const onFocused = vi.fn();
    renderWithProviders(
      <JobStatusMenu
        company="Celonis"
        currentStatus="INTERVIEW"
        focusOnMount
        onFocused={onFocused}
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Interview, change status for Celonis' }),
    ).toHaveFocus();
    expect(onFocused).toHaveBeenCalledOnce();
  });
});
