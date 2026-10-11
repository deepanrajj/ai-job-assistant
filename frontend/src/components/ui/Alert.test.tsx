import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Alert } from './Alert';

describe('Alert', () => {
  it('renders alert content with the default alert role', () => {
    render(<Alert>Failed to save job.</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save job.');
  });

  it('supports status live regions for non-error messages', () => {
    render(
      <Alert role="status" variant="success">
        Job saved successfully.
      </Alert>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Job saved successfully.');
  });

  it('renders a plain notice without a live role when not live', () => {
    render(<Alert live={false}>Dates unavailable</Alert>);

    expect(screen.getByText('Dates unavailable')).not.toHaveAttribute('role');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
