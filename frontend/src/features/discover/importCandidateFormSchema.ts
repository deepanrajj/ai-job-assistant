import { z } from 'zod';

import { createRequiredTrimmedTextSchema } from '../formSchema.utils';

/**
 * Accepts an optional source link only when it has an HTTP(S) host.
 *
 * @param {string} value Raw source link.
 * @returns {boolean} Whether the link can be saved.
 */
export const isValidImportCandidateSourceUrl = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed) return true;
  if (/\s/.test(trimmed)) return false;

  try {
    const url = new URL(trimmed);

    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
};

/**
 * Builds localized validation for manual candidate intake.
 *
 * @param {string} required Localized required-field message.
 * @param {string} invalidUrl Localized invalid-link message.
 * @returns {z.ZodObject} Candidate intake schema.
 */
export const createImportCandidateFormSchema = (required: string, invalidUrl: string) =>
  z.object({
    company: createRequiredTrimmedTextSchema(required),
    description: createRequiredTrimmedTextSchema(required),
    location: z.string(),
    roleTitle: createRequiredTrimmedTextSchema(required),
    sourceUrl: z.string().refine(isValidImportCandidateSourceUrl, { message: invalidUrl }),
  });
