import { z } from 'zod';

import { createRequiredTrimmedTextSchema } from '../formSchema.utils';

/**
 * Validation messages used by the analyze job form schema.
 */
export interface IAnalyzeJobFormSchemaMessages {
  emptyDescription: string;
}

/**
 * Creates the schema for validating a pasted job description.
 *
 * @param {IAnalyzeJobFormSchemaMessages} messages Localized validation messages.
 * @param {string} messages.emptyDescription Message shown when the description is empty.
 * @returns {z.ZodObject} Analyze job form schema.
 */
export const createAnalyzeJobFormSchema = ({ emptyDescription }: IAnalyzeJobFormSchemaMessages) =>
  z.object({
    description: createRequiredTrimmedTextSchema(emptyDescription),
  });

/**
 * Represents validated values submitted by the analyze job form.
 */
export type TAnalyzeJobFormValues = z.infer<ReturnType<typeof createAnalyzeJobFormSchema>>;
