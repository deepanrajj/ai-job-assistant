import { describe, expect, it } from 'vitest';

import {
  buildContactRequestPayload,
  isContactFormValid,
  isValidEmail,
  isValidProfileUrl,
  mapContactResponseToJobContact,
  toNullableTrimmed,
  type IContactFormValues,
} from './contacts.utils';
import type { TContactResponse } from './contacts.types';

const fullResponse: TContactResponse = {
  id: 'contact-001',
  type: 'RECRUITER',
  name: 'Jane Recruiter',
  email: 'jane@example.com',
  phone: '+49 170 1234567',
  profileUrl: 'https://www.linkedin.com/in/jane-recruiter',
  lastContactedAt: '2026-07-01',
  notes: 'Reached out on LinkedIn.',
  createdAt: '2026-05-01T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
};

describe('mapContactResponseToJobContact', () => {
  it('maps every field, dropping createdAt and updatedAt', () => {
    expect(mapContactResponseToJobContact(fullResponse)).toEqual({
      id: 'contact-001',
      type: 'RECRUITER',
      name: 'Jane Recruiter',
      email: 'jane@example.com',
      phone: '+49 170 1234567',
      profileUrl: 'https://www.linkedin.com/in/jane-recruiter',
      lastContactedAt: '2026-07-01',
      notes: 'Reached out on LinkedIn.',
    });
  });

  it('converts every null optional field to undefined', () => {
    const contact = mapContactResponseToJobContact({
      ...fullResponse,
      email: null,
      phone: null,
      profileUrl: null,
      lastContactedAt: null,
      notes: null,
    });

    expect(contact.email).toBeUndefined();
    expect(contact.phone).toBeUndefined();
    expect(contact.profileUrl).toBeUndefined();
    expect(contact.lastContactedAt).toBeUndefined();
    expect(contact.notes).toBeUndefined();
  });
});

describe('toNullableTrimmed', () => {
  it('trims surrounding whitespace', () => {
    expect(toNullableTrimmed('  jane@example.com  ')).toBe('jane@example.com');
  });

  it.each(['', '   ', '\t\n'])('treats %j as blank and returns null', (value) => {
    expect(toNullableTrimmed(value)).toBeNull();
  });
});

describe('buildContactRequestPayload', () => {
  it('trims text fields and keeps set values', () => {
    const payload = buildContactRequestPayload({
      type: 'RECRUITER',
      name: '  Jane Recruiter  ',
      email: '  jane@example.com  ',
      phone: '+49 170 1234567',
      profileUrl: 'https://www.linkedin.com/in/jane-recruiter',
      lastContactedAt: '2026-07-01',
      notes: '  Reached out.  ',
    });

    expect(payload).toEqual({
      type: 'RECRUITER',
      name: 'Jane Recruiter',
      email: 'jane@example.com',
      phone: '+49 170 1234567',
      profileUrl: 'https://www.linkedin.com/in/jane-recruiter',
      lastContactedAt: '2026-07-01',
      notes: 'Reached out.',
    });
  });

  it('sends null for every blank optional field', () => {
    const payload = buildContactRequestPayload({
      type: 'OTHER',
      name: 'Someone',
      email: '   ',
      phone: '',
      profileUrl: '',
      lastContactedAt: '',
      notes: '   ',
    });

    expect(payload).toEqual({
      type: 'OTHER',
      name: 'Someone',
      email: null,
      phone: null,
      profileUrl: null,
      lastContactedAt: null,
      notes: null,
    });
  });
});

describe('isValidProfileUrl', () => {
  it.each(['', '   '])('accepts a blank value (%j)', (value) => {
    expect(isValidProfileUrl(value)).toBe(true);
  });

  it.each([
    'https://www.linkedin.com/in/jane-recruiter',
    'http://example.com',
    '  https://example.com  ',
    'HTTPS://www.linkedin.com/in/jane-recruiter',
  ])('accepts %j', (value) => {
    expect(isValidProfileUrl(value)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'ftp://example.com', 'www.example.com', 'example.com'])(
    'rejects %j',
    (value) => {
      expect(isValidProfileUrl(value)).toBe(false);
    },
  );

  it('rejects a value with an embedded newline after a valid-looking scheme', () => {
    // A prefix-only check would accept this; the backend's @Pattern
    // requires the whole trimmed string to match, and `.` does not match
    // `\n`, so a value like this fails there. Anchoring with `$` here
    // keeps the two in agreement instead of the UI showing it as valid
    // right up until the submit gets a 400 back.
    expect(isValidProfileUrl('https://example.com\njavascript:alert(1)')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it.each(['', '   '])('accepts a blank value (%j)', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each(['jane@example.com', '  jane@example.com  ', 'jane.doe+recruiter@example.co.uk'])(
    'accepts %j',
    (value) => {
      expect(isValidEmail(value)).toBe(true);
    },
  );

  it.each(['not-an-email', 'jane@', '@example.com', 'jane example.com'])('rejects %j', (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('isContactFormValid', () => {
  const validValues: IContactFormValues = {
    email: 'jane@example.com',
    lastContactedAt: '',
    name: 'Jane Recruiter',
    notes: '',
    phone: '',
    profileUrl: 'https://www.linkedin.com/in/jane-recruiter',
    type: 'RECRUITER',
  };

  it('accepts a form with a name and well-formed optional fields', () => {
    expect(isContactFormValid(validValues)).toBe(true);
  });

  it('accepts a form with every optional field blank', () => {
    expect(isContactFormValid({ ...validValues, email: '', profileUrl: '' })).toBe(true);
  });

  it('rejects a blank name even when every other field is valid', () => {
    expect(isContactFormValid({ ...validValues, name: '   ' })).toBe(false);
  });

  it('rejects a malformed email', () => {
    expect(isContactFormValid({ ...validValues, email: 'not-an-email' })).toBe(false);
  });

  it('rejects a non-http(s) profile url', () => {
    expect(isContactFormValid({ ...validValues, profileUrl: 'javascript:alert(1)' })).toBe(false);
  });
});
