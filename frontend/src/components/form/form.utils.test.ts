import { describe, expect, it } from 'vitest';
import type { FieldErrors } from 'react-hook-form';

import { getFormFieldErrorMessage } from './form.utils';

type TFormValues = {
  company: string;
  job: {
    role: string;
  };
};

describe('getFormFieldErrorMessage', () => {
  it('reads flat and nested form field error messages', () => {
    const errors = {
      company: {
        message: 'Company is required',
        type: 'required',
      },
      job: {
        role: {
          message: 'Role is required',
          type: 'required',
        },
      },
    } as FieldErrors<TFormValues>;

    expect(getFormFieldErrorMessage(errors, 'company')).toBe('Company is required');
    expect(getFormFieldErrorMessage(errors, 'job.role')).toBe('Role is required');
    expect(getFormFieldErrorMessage(errors, 'job')).toBeUndefined();
  });
});
