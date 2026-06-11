import { z } from 'zod';

/**
 * Builds a text schema that trims submitted values and rejects empty text.
 *
 * @param {string} message Validation message shown when the value is empty.
 * @returns {z.ZodString} Required trimmed text schema.
 */
export const createRequiredTrimmedTextSchema = (message: string): z.ZodString =>
  z.string().trim().min(1, {
    message,
  });
