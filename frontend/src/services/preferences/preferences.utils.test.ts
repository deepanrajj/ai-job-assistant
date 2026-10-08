import { describe, expect, it } from 'vitest';

import {
  MAX_PREFERENCE_LIST_LENGTH,
  MAX_PREFERENCE_VALUE_LENGTH,
  createEmptyProfilePreferences,
  getPreferenceValueError,
  mapProfilePreferencesResponse,
  normalizePreferenceList,
  normalizeProfilePreferences,
} from './preferences.utils';

describe('normalizePreferenceList', () => {
  it('trims values and collapses inner whitespace', () => {
    expect(normalizePreferenceList(['  Spring   Boot ', 'React\tNative'])).toEqual([
      'Spring Boot',
      'React Native',
    ]);
  });

  it('drops case-insensitive duplicates, keeping the first spelling and the order', () => {
    expect(normalizePreferenceList(['TypeScript', 'react', 'typescript', 'React ', 'Go'])).toEqual([
      'TypeScript',
      'react',
      'Go',
    ]);
  });

  it('drops empty and over-long values', () => {
    expect(
      normalizePreferenceList(['', '   ', 'x'.repeat(MAX_PREFERENCE_VALUE_LENGTH + 1), 'ok']),
    ).toEqual(['ok']);
    expect(normalizePreferenceList(['x'.repeat(MAX_PREFERENCE_VALUE_LENGTH)])).toHaveLength(1);
  });

  it('caps the list length', () => {
    const many = Array.from(
      { length: MAX_PREFERENCE_LIST_LENGTH + 5 },
      (_, index) => `skill ${index}`,
    );

    expect(normalizePreferenceList(many)).toHaveLength(MAX_PREFERENCE_LIST_LENGTH);
  });
});

describe('normalizeProfilePreferences', () => {
  it('normalizes the free-text lists and de-duplicates the fixed choices', () => {
    expect(
      normalizeProfilePreferences({
        ...createEmptyProfilePreferences(),
        keywords: [' payments ', 'Payments'],
        locations: ['Berlin', ' berlin'],
        roles: ['Backend  Engineer'],
        seniority: ['SENIOR', 'SENIOR'],
        skills: ['Kotlin', 'kotlin'],
        workModes: ['REMOTE', 'REMOTE', 'HYBRID'],
      }),
    ).toEqual({
      keywords: ['payments'],
      locations: ['Berlin'],
      roles: ['Backend Engineer'],
      seniority: ['SENIOR'],
      skills: ['Kotlin'],
      workModes: ['REMOTE', 'HYBRID'],
    });
  });

  it('keeps a stored value outside the limits instead of dropping it on save', () => {
    const long = 'x'.repeat(MAX_PREFERENCE_VALUE_LENGTH + 10);
    const many = Array.from({ length: MAX_PREFERENCE_LIST_LENGTH + 1 }, (_, index) => `v${index}`);

    const normalized = normalizeProfilePreferences({
      ...createEmptyProfilePreferences(),
      roles: many,
      skills: [long],
    });

    expect(normalized.skills).toEqual([long]);
    expect(normalized.roles).toHaveLength(MAX_PREFERENCE_LIST_LENGTH + 1);
  });
});

describe('mapProfilePreferencesResponse', () => {
  it('turns missing, null, and non-list fields into empty lists', () => {
    expect(mapProfilePreferencesResponse({ skills: null, roles: 'Engineer' })).toEqual({
      ...createEmptyProfilePreferences(),
      updatedAt: null,
    });
    expect(mapProfilePreferencesResponse(null)).toEqual({
      ...createEmptyProfilePreferences(),
      updatedAt: null,
    });
  });

  it.each([[''], ['yesterday'], [42]])('reads an updatedAt of %j as never saved', (updatedAt) => {
    expect(mapProfilePreferencesResponse({ updatedAt }).updatedAt).toBeNull();
  });

  it('merges case-insensitive duplicates, which would share a chip key', () => {
    expect(
      mapProfilePreferencesResponse({
        skills: ['Kotlin', 'kotlin', 7],
        updatedAt: '2026-10-04T09:00:00Z',
        workModes: ['REMOTE', 'REMOTE'],
      }),
    ).toMatchObject({
      skills: ['Kotlin'],
      updatedAt: '2026-10-04T09:00:00Z',
      workModes: ['REMOTE'],
    });
  });
});

describe('getPreferenceValueError', () => {
  it('accepts a new value and treats a blank one as nothing to add', () => {
    expect(getPreferenceValueError(['Kotlin'], ' React ')).toBeNull();
    expect(getPreferenceValueError(['Kotlin'], '   ')).toBeNull();
  });

  it('refuses an over-long value, a duplicate in any case, and a full list', () => {
    expect(getPreferenceValueError([], 'x'.repeat(MAX_PREFERENCE_VALUE_LENGTH + 1))).toBe(
      'TOO_LONG',
    );
    expect(getPreferenceValueError([], 'x'.repeat(MAX_PREFERENCE_VALUE_LENGTH))).toBeNull();
    expect(getPreferenceValueError(['Kotlin'], ' KOTLIN ')).toBe('DUPLICATE');
    expect(
      getPreferenceValueError(
        Array.from({ length: MAX_PREFERENCE_LIST_LENGTH }, (_, index) => `v${index}`),
        'new',
      ),
    ).toBe('LIST_FULL');
  });
});
