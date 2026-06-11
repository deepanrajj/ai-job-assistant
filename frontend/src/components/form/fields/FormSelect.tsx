import { useFormContext, type FieldValues } from 'react-hook-form';

import { Select } from '../../ui';
import { getFormFieldErrorMessage } from '../form.utils';
import type { TFormSelectProps } from '../form.types';

/**
 * Connects the shared Select component to React Hook Form state.
 *
 * @param {TFormSelectProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Controlled select field.
 */
export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  rules,
  ...props
}: TFormSelectProps<TFieldValues>) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<TFieldValues>();
  const { ref, ...fieldProps } = register(name, rules);

  return (
    <Select {...props} {...fieldProps} error={getFormFieldErrorMessage(errors, name)} ref={ref} />
  );
};
