import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { BulletList } from './BulletList';

describe('BulletList', () => {
  it('renders items as a semantic list', () => {
    render(<BulletList items={['React', 'TypeScript']} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});
