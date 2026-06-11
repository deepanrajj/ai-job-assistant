import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AskJobAnswerSkeleton } from './AskJobAnswerSkeleton';

describe('AskJobAnswerSkeleton', () => {
  it('renders an accessible loading status region', () => {
    render(<AskJobAnswerSkeleton label="Asking..." />);

    expect(screen.getByRole('status', { name: 'Asking...' })).toBeInTheDocument();
  });
});
