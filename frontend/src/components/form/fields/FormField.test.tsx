import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { Form } from '../Form';
import type { TFormFieldConfig } from '../form.types';
import { FormField } from './FormField';

type TFormFieldValues = {
  company: string;
  notes: string;
  status: string;
};

/**
 * Props used by the generated field dispatcher test component.
 */
interface IFormFieldTestProps {
  field: TFormFieldConfig<TFormFieldValues>;
}

const FormFieldTest = ({ field }: IFormFieldTestProps) => {
  const form = useForm<TFormFieldValues>({
    defaultValues: {
      company: '',
      notes: '',
      status: '',
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <FormField<TFormFieldValues> field={field} />
    </Form>
  );
};

describe('FormField', () => {
  it('renders input field configs', () => {
    renderWithProviders(
      <FormFieldTest
        field={{
          label: 'Company',
          name: 'company',
          type: 'input',
        }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Company' })).toBeInTheDocument();
  });

  it('renders select field configs', () => {
    renderWithProviders(
      <FormFieldTest
        field={{
          label: 'Status',
          name: 'status',
          options: [
            {
              label: 'Applied',
              value: 'applied',
            },
          ],
          type: 'select',
        }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
  });

  it('renders textarea field configs', () => {
    renderWithProviders(
      <FormFieldTest
        field={{
          label: 'Notes',
          name: 'notes',
          type: 'textarea',
        }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
  });
});
