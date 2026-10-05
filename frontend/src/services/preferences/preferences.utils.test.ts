import { describe, expect, it } from 'vitest';

import {
  MAX_PREFERENCE_LIST_LENGTH,
  MAX_PREFERENCE_VALUE_LENGTH,
  createEmptyProfilePreferences,
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
});
