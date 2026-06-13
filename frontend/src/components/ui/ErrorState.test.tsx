import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders an accessible error message with an optional action', () => {
    render(
      <ErrorState
        action={<button type="button">Try again</button>}
        description="The jobs could not be loaded."
        title="Something went wrong"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText('The jobs could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
