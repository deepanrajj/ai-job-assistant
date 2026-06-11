import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { Form } from '../Form';
import { FormTextarea } from './FormTextarea';

type TFormTextareaValues = {
  notes: string;
};

const FormTextareaTest = () => {
  const form = useForm<TFormTextareaValues>({
    defaultValues: {
      notes: '',
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <FormTextarea<TFormTextareaValues>
        helperText="Keep the note short."
        label="Notes"
        name="notes"
        rules={{
          required: 'Notes are required',
        }}
      />
      <button type="submit">Submit</button>
    </Form>
  );
};

describe('FormTextarea', () => {
  it('connects shared textarea rendering to React Hook Form validation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FormTextareaTest />);

    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription(
      'Keep the note short.',
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Notes are required')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInvalid();
  });
});
