import { afterEach, describe, expect, it, vi } from 'vitest';

import { LANGUAGE_STORAGE_KEY } from '../constants';
import {
  getInitialLanguage,
  getNestedMessage,
  interpolate,
  isLanguage,
  translate,
} from './translation';

describe('translation utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks supported languages', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('de')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });

  it('uses stored language before browser language', () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'de');

    expect(getInitialLanguage()).toBe('de');
  });

  it('falls back to English before browser APIs are available', () => {
    const currentWindow = window;

    vi.stubGlobal('window', undefined);

    try {
      expect(getInitialLanguage()).toBe('en');
    } finally {
      vi.stubGlobal('window', currentWindow);
    }
  });

  it('falls back to German when browser language starts with de', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('de-DE');

    expect(getInitialLanguage()).toBe('de');
  });

  it('interpolates named placeholders', () => {
    expect(interpolate('Hello {{name}}', { name: 'Deepan' })).toBe('Hello Deepan');
    expect(interpolate('Hello')).toBe('Hello');
  });

  it('reads nested messages and ignores non-string paths', () => {
    expect(getNestedMessage({ route: { jobs: { title: 'Jobs' } } }, 'route.jobs.title')).toBe(
      'Jobs',
    );
    expect(getNestedMessage({ route: { jobs: { title: 'Jobs' } } }, 'route.jobs')).toBeUndefined();
    expect(getNestedMessage({ route: 'Routes' }, 'route.jobs.title')).toBeUndefined();
    expect(
      getNestedMessage({ route: { jobs: { title: 'Jobs' } } }, 'route.missing'),
    ).toBeUndefined();
  });

  it('translates nested locale keys with interpolation', () => {
    expect(translate('jobs.countSummary', { shown: 2, total: 4 }, 'en')).toBe(
      '2 of 4 opportunities shown',
    );
    expect(translate('missing.key', undefined, 'en')).toBe('missing.key');
  });
});
