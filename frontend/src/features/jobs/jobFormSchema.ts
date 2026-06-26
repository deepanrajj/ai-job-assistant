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
}

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
 * Checks whether an optional string contains a positive number.
 *
 * @param {string} value Optional salary text.
 * @returns {boolean} True when the value is empty or a positive number.
 */
const isOptionalPositiveNumber = (value: string): boolean => {
  if (!value.trim()) return true;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0;
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
}: IJobFormSchemaMessages) =>
  z
    .object({
      company: createRequiredTrimmedTextSchema(requiredCompany),
      description: z.string().trim(),
      jobUrl: z.string().trim().refine(isOptionalUrl, {
        message: invalidUrl,
      }),
      location: z.string().trim(),
      nextStep: z.string().trim(),
      roleTitle: createRequiredTrimmedTextSchema(requiredRole),
      salaryMax: z.string().trim().refine(isOptionalPositiveNumber, {
        message: invalidSalary,
      }),
      salaryMin: z.string().trim().refine(isOptionalPositiveNumber, {
        message: invalidSalary,
      }),
      status: z.enum(jobStatusOptions),
      tags: z.string().trim(),
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
