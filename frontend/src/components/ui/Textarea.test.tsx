import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('connects the label and helper text to the textarea', () => {
    render(<Textarea helperText="Paste the full description." label="Job description" />);

    expect(screen.getByRole('textbox', { name: 'Job description' })).toHaveAccessibleDescription(
      'Paste the full description.',
    );
  });

  it('marks the textarea invalid when an error message is provided', () => {
    render(<Textarea error="Description is required" label="Job description" />);

    expect(screen.getByRole('textbox', { name: 'Job description' })).toBeInvalid();
    expect(screen.getByRole('textbox', { name: 'Job description' })).toHaveAccessibleDescription(
      'Description is required',
    );
  });
});
