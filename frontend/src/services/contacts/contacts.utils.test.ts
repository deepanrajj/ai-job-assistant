import { describe, expect, it } from 'vitest';

import {
  buildContactRequestPayload,
  mapContactResponseToJobContact,
  toNullableTrimmed,
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
