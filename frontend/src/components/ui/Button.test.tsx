import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './Button';

describe('Button', () => {
  it('renders as a button by default and handles clicks', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders icon slots without changing the accessible name', () => {
    render(
      <Button
        leftIcon={<span aria-hidden="true">+</span>}
        rightIcon={<span aria-hidden="true">→</span>}
      >
        Add Job
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Add Job' })).toBeInTheDocument();
  });
});
