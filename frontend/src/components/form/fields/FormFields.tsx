import type { FieldValues } from 'react-hook-form';

import { FormField } from './FormField';
import { classNames } from '../../../utils';
import { formFieldGridColumns } from '../form.constants';
import type { TFormFieldColumns, TFormFieldConfig } from '../form.types';

/**
 * Props used by the generated form fields grid.
 */
interface IFormFieldsProps<TFieldValues extends FieldValues> {
  className?: string;
  columns?: TFormFieldColumns;
  fields: TFormFieldConfig<TFieldValues>[];
}

/**
 * Renders a responsive grid of generated form fields.
 *
 * @param {IFormFieldsProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Form fields grid.
 */
export const FormFields = <TFieldValues extends FieldValues>({
  className = '',
  columns = 1,
  fields,
}: IFormFieldsProps<TFieldValues>) => (
  <div className={classNames('grid gap-4', formFieldGridColumns[columns], className)}>
    {fields.map((field) => (
      <FormField<TFieldValues> field={field} key={field.name} />
    ))}
  </div>
);
