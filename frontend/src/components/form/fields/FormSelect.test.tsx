import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { Form } from '../Form';
import { FormSelect } from './FormSelect';

type TFormSelectValues = {
  status: string;
};

const FormSelectTest = () => {
  const form = useForm<TFormSelectValues>({
    defaultValues: {
      status: '',
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <FormSelect<TFormSelectValues>
        helperText="Choose the current job status."
        label="Status"
        name="status"
        rules={{
          required: 'Status is required',
        }}
      >
        <option value="">Select status</option>
        <option value="applied">Applied</option>
      </FormSelect>
      <button type="submit">Submit</button>
    </Form>
  );
};

describe('FormSelect', () => {
  it('connects shared select rendering to React Hook Form validation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FormSelectTest />);

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAccessibleDescription(
      'Choose the current job status.',
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Status is required')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInvalid();
  });
});
