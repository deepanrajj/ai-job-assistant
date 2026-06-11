import { useFormContext, type FieldValues } from 'react-hook-form';

import { Input } from '../../ui';
import { getFormFieldErrorMessage } from '../form.utils';
import type { TFormInputProps } from '../form.types';

/**
 * Connects the shared Input component to React Hook Form state.
 *
 * @param {TFormInputProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Controlled input field.
 */
export const FormInput = <TFieldValues extends FieldValues>({
  name,
  rules,
  ...props
}: TFormInputProps<TFieldValues>) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<TFieldValues>();
  const { ref, ...fieldProps } = register(name, rules);

  return (
    <Input {...props} {...fieldProps} error={getFormFieldErrorMessage(errors, name)} ref={ref} />
  );
};
