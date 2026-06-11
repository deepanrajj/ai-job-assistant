import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Card } from './Card';

describe('Card', () => {
  it('renders header, action, and body content', () => {
    render(
      <Card action={<button type="button">Edit</button>} subtitle="Updated today" title="Job">
        <p>Frontend Engineer</p>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Job' })).toBeInTheDocument();
    expect(screen.getByText('Updated today')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
  });

  it('renders body content without a header when no header props are provided', () => {
    render(
      <Card>
        <p>Only body</p>
      </Card>,
    );

    expect(screen.getByText('Only body')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
