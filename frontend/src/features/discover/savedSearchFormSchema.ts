import { z } from 'zod';

import { createRequiredTrimmedTextSchema } from '../formSchema.utils';
import type { TSeniorityLevel, TWorkMode } from '../../services';

/**
 * Builds the saved search editor schema with a localized name error.
 * Stored choices outside this client's options remain valid so editing
 * another field does not discard them.
 *
 * @param {string} requiredName Localized required-name message.
 * @returns {z.ZodObject} Saved search criteria schema.
 */
export const createSavedSearchFormSchema = (requiredName: string) =>
  z.object({
    location: z.string(),
    name: createRequiredTrimmedTextSchema(requiredName),
    notes: z.string(),
    role: z.string(),
    seniority: z.array(z.custom<TSeniorityLevel>()),
    skills: z.array(z.string()),
    workModes: z.array(z.custom<TWorkMode>()),
  });
