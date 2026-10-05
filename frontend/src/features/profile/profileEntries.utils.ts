import { isValidProfileUrl, type TResumeProfileContent } from '../../services';
import { createLocalId } from '../jobs/jobs.utils';

/**
 * Anything a profile lists in order and must keep identifiable.
 */
interface IEntry {
  id: string;
}

/**
 * Creates the id for a new entry. Generated once, when the entry is added,
 * and never recomputed afterwards: later AI output cites entries by it.
 *
 * @returns {string} New entry id.
 */
export const createProfileEntryId = (): string => createLocalId('entry');

/**
 * Appends a new entry with a fresh id.
 *
 * @param {T[]} entries Current entries.
 * @param {Omit<T, 'id'>} fields The new entry's fields.
 * @returns {T[]} A new list with the entry added last.
 */
export const addProfileEntry = <T extends IEntry>(entries: T[], fields: Omit<T, 'id'>): T[] => [
  ...entries,
  { ...fields, id: createProfileEntryId() } as T,
];

/**
 * Changes an entry's fields and keeps its id.
 *
 * @param {T[]} entries Current entries.
 * @param {string} id Entry to change.
 * @param {Partial<Omit<T, 'id'>>} changes Fields to change.
 * @returns {T[]} A new list with that entry changed in place.
 */
export const updateProfileEntry = <T extends IEntry>(
  entries: T[],
  id: string,
  changes: Partial<Omit<T, 'id'>>,
): T[] => entries.map((entry) => (entry.id === id ? { ...entry, ...changes, id } : entry));

/**
 * Moves an entry one place up (-1) or down (1). Moving past either end
 * leaves the list unchanged. Ids are untouched.
 *
 * @param {T[]} entries Current entries.
 * @param {string} id Entry to move.
 * @param {-1 | 1} direction Up or down.
 * @returns {T[]} A new list in the new order.
 */
export const moveProfileEntry = <T extends IEntry>(
  entries: T[],
  id: string,
  direction: -1 | 1,
): T[] => {
  const from = entries.findIndex((entry) => entry.id === id);
  const to = from + direction;

  if (from === -1 || to < 0 || to >= entries.length) return entries;

  const next = [...entries];
  const [moved] = next.splice(from, 1);

  next.splice(to, 0, moved as T);

  return next;
};

/**
 * Removes one entry.
 *
 * @param {T[]} entries Current entries.
 * @param {string} id Entry to remove.
 * @returns {T[]} A new list without it.
 */
export const removeProfileEntry = <T extends IEntry>(entries: T[], id: string): T[] =>
  entries.filter((entry) => entry.id !== id);

/**
 * The content a new profile starts with.
 *
 * @returns {TResumeProfileContent} Empty base profile content.
 */
export const createEmptyProfileContent = (): TResumeProfileContent => ({
  education: [],
  highlights: [],
  links: [],
  notes: '',
  summary: '',
  targetRole: 'BASE',
});

/**
 * Checks whether a profile can be saved: a name, and every link with a
 * label and an http(s) URL.
 *
 * @param {string} name Profile name.
 * @param {TResumeProfileContent} content Profile content.
 * @returns {boolean} True when the profile is ready to save.
 */
export const isResumeProfileValid = (name: string, content: TResumeProfileContent): boolean =>
  Boolean(name.trim()) &&
  content.links.every(
    (link) => Boolean(link.label.trim()) && Boolean(link.url.trim()) && isValidProfileUrl(link.url),
  );

/**
 * Trims every text field before saving. Entry ids and order are kept.
 *
 * @param {TResumeProfileContent} content Profile content as edited.
 * @returns {TResumeProfileContent} Content ready to send.
 */
export const normalizeProfileContent = (content: TResumeProfileContent): TResumeProfileContent => ({
  education: content.education.map((entry) => ({ ...entry, text: entry.text.trim() })),
  highlights: content.highlights.map((entry) => ({ ...entry, text: entry.text.trim() })),
  links: content.links.map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() })),
  notes: content.notes.trim(),
  summary: content.summary.trim(),
  targetRole: content.targetRole,
});
