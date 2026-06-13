import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { JobTags } from './JobTags';

describe('JobTags', () => {
  it('renders each job tag', () => {
    render(<JobTags tags={['React', 'TypeScript']} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});
