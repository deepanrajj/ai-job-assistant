import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { KanbanIcon } from './KanbanIcon';

describe('KanbanIcon', () => {
  it('renders a decorative Kanban SVG', () => {
    const { container } = render(<KanbanIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
