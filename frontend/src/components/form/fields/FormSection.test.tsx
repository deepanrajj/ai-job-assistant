import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { Form } from '../Form';
import type { TFormFieldConfig } from '../form.types';
import { FormSection } from './FormSection';

type TFormSectionValues = {
  company: string;
};

const fields: TFormFieldConfig<TFormSectionValues>[] = [
  {
    label: 'Company',
    name: 'company',
    type: 'input',
  },
];

const FormSectionTest = () => {
  const form = useForm<TFormSectionValues>({
    defaultValues: {
      company: '',
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <FormSection<TFormSectionValues>
        fields={fields}
        subtitle="Main application details"
        title="Job details"
      />
    </Form>
  );
};

describe('FormSection', () => {
  it('renders a card section around generated fields', () => {
    renderWithProviders(<FormSectionTest />);

    expect(screen.getByRole('heading', { name: 'Job details' })).toBeInTheDocument();
    expect(screen.getByText('Main application details')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Company' })).toBeInTheDocument();
  });
});
