import { z } from 'zod';

import { createRequiredTrimmedTextSchema } from '../formSchema.utils';

const MAX_SHORT_TEXT_LENGTH = 255;
const MAX_URL_LENGTH = 2048;

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
 * @param {string} tooLongText Localized short-text limit message.
 * @param {string} tooLongUrl Localized link limit message.
 * @returns {z.ZodObject} Candidate intake schema.
 */
export const createImportCandidateFormSchema = (
  required: string,
  invalidUrl: string,
  tooLongText: string,
  tooLongUrl: string,
) =>
  z.object({
    company: createRequiredTrimmedTextSchema(required).max(MAX_SHORT_TEXT_LENGTH, {
      message: tooLongText,
    }),
    description: createRequiredTrimmedTextSchema(required),
    location: z.string().trim().max(MAX_SHORT_TEXT_LENGTH, { message: tooLongText }),
    roleTitle: createRequiredTrimmedTextSchema(required).max(MAX_SHORT_TEXT_LENGTH, {
      message: tooLongText,
    }),
    sourceUrl: z
      .string()
      .trim()
      .max(MAX_URL_LENGTH, { message: tooLongUrl })
      .refine(isValidImportCandidateSourceUrl, { message: invalidUrl }),
  });
