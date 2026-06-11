import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Input } from './Input';

describe('Input', () => {
  it('connects the label and helper text to the input', () => {
    render(<Input helperText="Search by company or role." label="Search" />);

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAccessibleDescription(
      'Search by company or role.',
    );
  });

  it('marks the input invalid when an error message is provided', () => {
    render(<Input error="Company is required" label="Company" />);

    expect(screen.getByRole('textbox', { name: 'Company' })).toBeInvalid();
    expect(screen.getByRole('textbox', { name: 'Company' })).toHaveAccessibleDescription(
      'Company is required',
    );
  });
});
