import type { TFormFieldColumns } from './form.types';

/**
 * Tailwind grid class map for generated form field columns.
 */
export const formFieldGridColumns: Record<TFormFieldColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
};
