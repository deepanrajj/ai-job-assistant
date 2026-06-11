import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Select } from './Select';

describe('Select', () => {
  it('connects the label and helper text to the select', () => {
    render(
      <Select defaultValue="applied" helperText="Filter by job status." label="Status">
        <option value="applied">Applied</option>
        <option value="interview">Interview</option>
      </Select>,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('applied');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAccessibleDescription(
      'Filter by job status.',
    );
  });

  it('marks the select invalid when an error message is provided', () => {
    render(
      <Select error="Status is required" label="Status">
        <option value="">Select status</option>
      </Select>,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInvalid();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAccessibleDescription(
      'Status is required',
    );
  });
});
