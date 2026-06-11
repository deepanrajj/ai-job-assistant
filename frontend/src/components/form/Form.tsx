import type { FormHTMLAttributes, ReactNode } from 'react';
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

/**
 * Props used by the React Hook Form provider wrapper.
 */
interface IFormProps<TFieldValues extends FieldValues> extends Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> {
  children: ReactNode;
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
}

/**
 * Wraps a form with React Hook Form context and wires submit handling.
 *
 * @param {IFormProps<TFieldValues>} props Component props.
 * @returns {JSX.Element} Form provider and form element.
 */
export const Form = <TFieldValues extends FieldValues>({
  children,
  form,
  onSubmit,
  ...props
}: IFormProps<TFieldValues>) => (
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
      {children}
    </form>
  </FormProvider>
);
