import { z } from 'zod';

import { createRequiredTrimmedTextSchema } from '../formSchema.utils';
import { jobStatusOptions } from './jobs.constants';

/**
 * Validation messages used by the job form schema.
 */
export interface IJobFormSchemaMessages {
  invalidSalary: string;
  invalidSalaryRange: string;
  invalidUrl: string;
  requiredCompany: string;
  requiredRole: string;
  tooLongText: string;
  tooLongUrl: string;
}

/**
 * Field limits mirroring the backend's `@Size` and `@Digits` constraints.
 *
 * Kept in step with `JobFieldLimits.kt` on purpose. Without them the form
 * submits values the API rejects with a 400 that names the offending field
 * in a part of the body this client does not read, so the user is told that
 * validation failed and never which field to fix.
 */
const MAX_SHORT_TEXT_LENGTH = 255;

const MAX_URL_LENGTH = 2048;

const MAX_SALARY = 9_999_999_999;

const MAX_SALARY_FRACTION_DIGITS = 2;

/**
 * Checks whether an optional string contains a valid URL.
 *
 * @param {string} value Optional URL text.
 * @returns {boolean} True when the value is empty or a valid URL.
 */
const isOptionalUrl = (value: string): boolean => {
  if (!value.trim()) return true;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Counts the decimal places the request body would carry for a salary.
 *
 * Read from the number rather than the typed text, because that is what
 * `createJobFormFields` sends: "1.5e3" reaches the API as 1500, with none.
 * A magnitude small enough to keep its exponent in `toString` has more
 * decimal places than the backend accepts unless it is a whole number.
 *
 * @param {number} value Salary as the request would carry it.
 * @returns {number} Decimal places in the value sent.
 */
const getSalaryFractionDigits = (value: number): number => {
  const text = value.toString();

  if (text.includes('e')) return Number.isInteger(value) ? 0 : MAX_SALARY_FRACTION_DIGITS + 1;

  return (text.split('.')[1] ?? '').length;
};

/**
 * Checks whether an optional string contains a salary the backend accepts.
 *
 * Mirrors `@Digits(integer = 10, fraction = 2)` in full. Checking only the
 * digit count would leave 70000.555 to be rejected by the API instead, as a
 * 400 whose message names no field.
 *
 * @param {string} value Optional salary text.
 * @returns {boolean} True when the value is empty or a salary within limits.
 */
const isOptionalPositiveNumber = (value: string): boolean => {
  if (!value.trim()) return true;

  const numberValue = Number(value);

  return (
    Number.isFinite(numberValue) &&
    numberValue > 0 &&
    numberValue <= MAX_SALARY &&
    getSalaryFractionDigits(numberValue) <= MAX_SALARY_FRACTION_DIGITS
  );
};

/**
 * Converts optional salary text into a comparable number.
 *
 * @param {string} value Optional salary text.
 * @returns {number | null} Salary number or null when empty.
 */
const getOptionalSalaryValue = (value: string): number | null =>
  value.trim() ? Number(value) : null;

/**
 * Creates the schema for validating the add/edit job form.
 *
 * @param {IJobFormSchemaMessages} messages Localized validation messages.
 * @returns {z.ZodObject} Job form schema.
 */
export const createJobFormSchema = ({
  invalidSalary,
  invalidSalaryRange,
  invalidUrl,
  requiredCompany,
  requiredRole,
  tooLongText,
  tooLongUrl,
}: IJobFormSchemaMessages) =>
  z
    .object({
      company: createRequiredTrimmedTextSchema(requiredCompany).max(MAX_SHORT_TEXT_LENGTH, {
        message: tooLongText,
      }),
      description: z.string().trim(),
      jobUrl: z
        .string()
        .trim()
        .max(MAX_URL_LENGTH, {
          message: tooLongUrl,
        })
        .refine(isOptionalUrl, {
          message: invalidUrl,
        }),
      location: z.string().trim().max(MAX_SHORT_TEXT_LENGTH, {
        message: tooLongText,
      }),
      roleTitle: createRequiredTrimmedTextSchema(requiredRole).max(MAX_SHORT_TEXT_LENGTH, {
        message: tooLongText,
      }),
      salaryMax: z.string().trim().refine(isOptionalPositiveNumber, {
        message: invalidSalary,
      }),
      salaryMin: z.string().trim().refine(isOptionalPositiveNumber, {
        message: invalidSalary,
      }),
      status: z.enum(jobStatusOptions),
    })
    .refine(
      ({ salaryMax, salaryMin }) => {
        const minSalary = getOptionalSalaryValue(salaryMin);
        const maxSalary = getOptionalSalaryValue(salaryMax);

        return minSalary === null || maxSalary === null || minSalary <= maxSalary;
      },
      {
        message: invalidSalaryRange,
        path: ['salaryMax'],
      },
    );

/**
 * Represents validated values submitted by the add/edit job form.
 */
export type TJobFormValues = z.infer<ReturnType<typeof createJobFormSchema>>;
