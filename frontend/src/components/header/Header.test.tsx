import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Header } from './Header';

describe('Header', () => {
  it('renders the standalone assistant header content', () => {
    render(<Header />);

    expect(
      screen.getByRole('heading', { name: 'AI Job Description Assistant' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Paste a job description, analyze it with AI, and prepare smarter.'),
    ).toBeInTheDocument();
  });
});
