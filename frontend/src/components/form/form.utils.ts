import { get, type FieldErrors, type FieldValues, type Path } from 'react-hook-form';

/**
 * Reads a field error message from React Hook Form errors using a field path.
 *
 * @param {FieldErrors<TFieldValues>} errors Current React Hook Form error object.
 * @param {Path<TFieldValues>} name Field path to read.
 * @returns {string | undefined} Field error message when one exists.
 */
export const getFormFieldErrorMessage = <TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  name: Path<TFieldValues>,
): string | undefined => {
  const fieldError = get(errors, name) as { message?: string } | undefined;
  return fieldError?.message;
};
