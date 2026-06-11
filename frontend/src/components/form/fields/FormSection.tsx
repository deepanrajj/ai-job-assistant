import type { FieldValues } from 'react-hook-form';

import { FormFields } from './FormFields';
import { Card } from '../../ui';
import type { TFormFieldColumns, TFormFieldConfig } from '../form.types';

/**
 * Props used by the card-wrapped generated form section.
 */
interface IFormSectionProps<TFieldValues extends FieldValues> {
  className?: string;
  columns?: TFormFieldColumns;
  fields: TFormFieldConfig<TFieldValues>[];
  subtitle?: string;
  title?: string;
}

/**
 * Renders a card section containing generated form fields.
 *
 * @param {IFormSectionProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Card-wrapped form section.
 */
export const FormSection = <TFieldValues extends FieldValues>({
  className,
  columns = 1,
  fields,
  subtitle,
  title,
}: IFormSectionProps<TFieldValues>) => (
  <Card subtitle={subtitle} title={title}>
    <FormFields<TFieldValues> className={className} columns={columns} fields={fields} />
  </Card>
);
