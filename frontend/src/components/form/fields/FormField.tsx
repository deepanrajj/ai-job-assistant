import type { FieldValues } from 'react-hook-form';

import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';
import { FormTextarea } from './FormTextarea';
import type { TFormFieldConfig } from '../form.types';

/**
 * Props used by the generated form field dispatcher.
 */
interface IFormFieldProps<TFieldValues extends FieldValues> {
  field: TFormFieldConfig<TFieldValues>;
}

/**
 * Dispatches a field config to the matching controlled form field component.
 *
 * @param {IFormFieldProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Generated form control.
 */
export const FormField = <TFieldValues extends FieldValues>({
  field,
}: IFormFieldProps<TFieldValues>) => {
  const { ariaLabel, className, containerClassName, helperText, label, name, rules } = field;

  if (field.type === 'textarea')
    return (
      <FormTextarea<TFieldValues>
        aria-label={ariaLabel}
        className={className}
        containerClassName={containerClassName}
        helperText={helperText}
        label={label}
        name={name}
        placeholder={field.placeholder}
        rows={field.rows}
        rules={rules}
      />
    );

  if (field.type === 'select')
    return (
      <FormSelect<TFieldValues>
        aria-label={ariaLabel}
        className={className}
        containerClassName={containerClassName}
        helperText={helperText}
        label={label}
        name={name}
        rules={rules}
      >
        {field.options.map(({ disabled, label, value }) => (
          <option disabled={disabled} key={String(value)} value={value}>
            {label}
          </option>
        ))}
      </FormSelect>
    );

  return (
    <FormInput<TFieldValues>
      aria-label={ariaLabel}
      className={className}
      containerClassName={containerClassName}
      helperText={helperText}
      label={label}
      leftIcon={field.leftIcon}
      name={name}
      placeholder={field.placeholder}
      rules={rules}
      type={field.inputType}
    />
  );
};
