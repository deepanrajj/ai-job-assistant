import { describe, expect, it } from 'vitest';

import {
  addProfileEntry,
  createEmptyProfileContent,
  isResumeProfileValid,
  moveProfileEntry,
  normalizeProfileContent,
  removeProfileEntry,
  updateProfileEntry,
} from './profileEntries.utils';
import type { TProfileTextEntry } from '../../services';

const entries: TProfileTextEntry[] = [
  { id: 'a', text: 'First' },
  { id: 'b', text: 'Second' },
  { id: 'c', text: 'Third' },
];

describe('profile entry helpers', () => {
  it('gives an added entry a new id unlike any existing one', () => {
    const added = addProfileEntry(entries, { text: 'Fourth' });
    const newEntry = added[3];

    expect(added.slice(0, 3)).toEqual(entries);
    expect(newEntry?.text).toBe('Fourth');
    expect(newEntry?.id).toBeTruthy();
    expect(entries.map((entry) => entry.id)).not.toContain(newEntry?.id);
    expect(addProfileEntry<TProfileTextEntry>([], { text: 'x' })[0]?.id).not.toBe(newEntry?.id);
  });

  it('keeps the id when an entry is edited', () => {
    expect(updateProfileEntry(entries, 'b', { text: 'Reworded' })).toEqual([
      { id: 'a', text: 'First' },
      { id: 'b', text: 'Reworded' },
      { id: 'c', text: 'Third' },
    ]);
  });

  it('cannot change an id through an edit', () => {
    const changes = { id: 'z', text: 'Sneaky' } as Partial<Omit<TProfileTextEntry, 'id'>>;

    expect(updateProfileEntry(entries, 'b', changes)[1]?.id).toBe('b');
  });

  it('keeps every id when an entry moves up or down', () => {
    expect(moveProfileEntry(entries, 'c', -1).map((entry) => entry.id)).toEqual(['a', 'c', 'b']);
    expect(moveProfileEntry(entries, 'a', 1).map((entry) => entry.id)).toEqual(['b', 'a', 'c']);
  });

  it('leaves the list unchanged when moving past either end or an unknown entry', () => {
    expect(moveProfileEntry(entries, 'a', -1)).toBe(entries);
    expect(moveProfileEntry(entries, 'c', 1)).toBe(entries);
    expect(moveProfileEntry(entries, 'missing', 1)).toBe(entries);
  });

  it('removes only the chosen entry', () => {
    expect(removeProfileEntry(entries, 'b').map((entry) => entry.id)).toEqual(['a', 'c']);
  });
});

describe('isResumeProfileValid', () => {
  const content = createEmptyProfileContent();

  it('needs a name', () => {
    expect(isResumeProfileValid('  ', content)).toBe(false);
    expect(isResumeProfileValid('Base', content)).toBe(true);
  });

  it('needs every link to have a label and an http(s) URL', () => {
    const link = { id: 'l', label: 'GitHub', url: 'https://github.com/example' };

    expect(isResumeProfileValid('Base', { ...content, links: [link] })).toBe(true);
    expect(isResumeProfileValid('Base', { ...content, links: [{ ...link, label: ' ' }] })).toBe(
      false,
    );
    expect(isResumeProfileValid('Base', { ...content, links: [{ ...link, url: '' }] })).toBe(false);
    expect(
      isResumeProfileValid('Base', {
        ...content,
        links: [{ ...link, url: 'javascript:alert(1)' }],
      }),
    ).toBe(false);
  });

  it('ignores a link left entirely blank, which is not saved', () => {
    expect(
      isResumeProfileValid('Base', { ...content, links: [{ id: 'l', label: ' ', url: '' }] }),
    ).toBe(true);
  });
});

describe('normalizeProfileContent', () => {
  it('drops entries and links left empty', () => {
    expect(
      normalizeProfileContent({
        ...createEmptyProfileContent(),
        education: [{ id: 'e', text: '  ' }],
        highlights: [
          { id: 'h1', text: '' },
          { id: 'h2', text: 'Kept' },
        ],
        links: [{ id: 'l', label: ' ', url: ' ' }],
      }),
    ).toMatchObject({ education: [], highlights: [{ id: 'h2', text: 'Kept' }], links: [] });
  });

  it('trims text and keeps ids and order', () => {
    expect(
      normalizeProfileContent({
        education: [{ id: 'e', text: ' BSc ' }],
        highlights: [
          { id: 'h2', text: ' Second ' },
          { id: 'h1', text: 'First' },
        ],
        links: [{ id: 'l', label: ' GitHub ', url: ' https://github.com/x ' }],
        notes: ' note ',
        summary: ' summary ',
        targetRole: 'BACKEND',
      }),
    ).toEqual({
      education: [{ id: 'e', text: 'BSc' }],
      highlights: [
        { id: 'h2', text: 'Second' },
        { id: 'h1', text: 'First' },
      ],
      links: [{ id: 'l', label: 'GitHub', url: 'https://github.com/x' }],
      notes: 'note',
      summary: 'summary',
      targetRole: 'BACKEND',
    });
  });
});
