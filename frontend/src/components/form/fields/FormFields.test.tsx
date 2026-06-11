import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { Form } from '../Form';
import type { TFormFieldConfig } from '../form.types';
import { FormFields } from './FormFields';

type TFormFieldsValues = {
  company: string;
  status: string;
};

const fields: TFormFieldConfig<TFormFieldsValues>[] = [
  {
    label: 'Company',
    name: 'company',
    type: 'input',
  },
  {
    label: 'Status',
    name: 'status',
    options: [
      {
        label: 'Applied',
        value: 'applied',
      },
    ],
    type: 'select',
  },
];

const FormFieldsTest = () => {
  const form = useForm<TFormFieldsValues>({
    defaultValues: {
      company: '',
      status: '',
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <FormFields<TFormFieldsValues> columns={2} fields={fields} />
    </Form>
  );
};

describe('FormFields', () => {
  it('renders each generated field config', () => {
    renderWithProviders(<FormFieldsTest />);

    expect(screen.getByRole('textbox', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
  });
});
