import { z } from 'zod';

import { createRequiredTrimmedTextSchema } from '../formSchema.utils';

/**
 * Validation messages used by the ask job form schema.
 */
export interface IAskJobFormSchemaMessages {
  emptyQuestion: string;
}

/**
 * Creates the schema for validating a follow-up question.
 *
 * @param {IAskJobFormSchemaMessages} messages Localized validation messages.
 * @param {string} messages.emptyQuestion Message shown when the question is empty.
 * @returns {z.ZodObject} Ask job form schema.
 */
export const createAskJobFormSchema = ({ emptyQuestion }: IAskJobFormSchemaMessages) =>
  z.object({
    question: createRequiredTrimmedTextSchema(emptyQuestion),
  });

/**
 * Represents validated values submitted by the ask job form.
 */
export type TAskJobFormValues = z.infer<ReturnType<typeof createAskJobFormSchema>>;
