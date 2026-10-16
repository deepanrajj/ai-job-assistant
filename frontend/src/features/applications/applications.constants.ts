import { tileToneClasses } from '../../components/ui';
import type { TJobDocumentType } from '../../types';

/**
 * Type badge tint per document type, from the shared tile tones.
 */
export const DOCUMENT_TYPE_TONES: Record<TJobDocumentType, string> = {
  COVER_LETTER: tileToneClasses.mint,
  CV: tileToneClasses.lavender,
  OTHER: tileToneClasses.blue,
  PORTFOLIO: tileToneClasses.peach,
};
