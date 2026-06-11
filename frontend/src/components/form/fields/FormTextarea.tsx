import { useFormContext, type FieldValues } from 'react-hook-form';

import { Textarea } from '../../ui';
import { getFormFieldErrorMessage } from '../form.utils';
import type { TFormTextareaProps } from '../form.types';

/**
 * Connects the shared Textarea component to React Hook Form state.
 *
 * @param {TFormTextareaProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Controlled textarea field.
 */
export const FormTextarea = <TFieldValues extends FieldValues>({
  name,
  rules,
  ...props
}: TFormTextareaProps<TFieldValues>) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<TFieldValues>();
  const { ref, ...fieldProps } = register(name, rules);

  return (
    <Textarea {...props} {...fieldProps} error={getFormFieldErrorMessage(errors, name)} ref={ref} />
  );
};
