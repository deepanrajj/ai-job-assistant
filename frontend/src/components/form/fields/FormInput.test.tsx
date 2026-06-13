import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import { Form } from '../Form';
import { FormInput } from './FormInput';
import { renderWithProviders } from '../../../test/renderWithProviders';

type TFormInputValues = {
  company: string;
};

const FormInputTest = () => {
  const form = useForm<TFormInputValues>({
    defaultValues: {
      company: '',
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <FormInput<TFormInputValues>
        helperText="Use the company name from the posting."
        label="Company"
        name="company"
        rules={{
          required: 'Company is required',
        }}
      />
      <button type="submit">Submit</button>
    </Form>
  );
};

describe('FormInput', () => {
  it('connects shared input rendering to React Hook Form validation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FormInputTest />);

    expect(screen.getByRole('textbox', { name: 'Company' })).toHaveAccessibleDescription(
      'Use the company name from the posting.',
    );

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Company is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Company' })).toBeInvalid();
  });
});
