import { describe, expect, it } from 'vitest';

import {
  buildDocumentRequestPayload,
  isDocumentFormValid,
  isValidDocumentUrl,
  mapDocumentResponseToJobDocument,
  type IDocumentFormValues,
} from './documents.utils';
import { createMockDocumentResponse } from '../../test/mockDocuments';

const validValues: IDocumentFormValues = {
  notes: '',
  submittedAt: '',
  title: 'CV - backend v3',
  type: 'CV',
  url: '',
};

describe('mapDocumentResponseToJobDocument', () => {
  it('maps every field and turns null optionals into undefined', () => {
    expect(mapDocumentResponseToJobDocument(createMockDocumentResponse())).toEqual({
      id: 'a5555555-5555-4555-8555-555555555555',
      notes: undefined,
      submittedAt: undefined,
      title: 'CV - backend v3',
      type: 'CV',
      url: undefined,
    });
  });

  it('keeps set optional fields', () => {
    const document = mapDocumentResponseToJobDocument(
      createMockDocumentResponse({
        notes: 'Sent by email',
        submittedAt: '2026-05-10',
        url: 'https://example.com',
      }),
    );

    expect(document).toMatchObject({
      notes: 'Sent by email',
      submittedAt: '2026-05-10',
      url: 'https://example.com',
    });
  });
});

describe('isValidDocumentUrl', () => {
  it.each(['', '  ', 'https://example.com', 'HTTP://example.com'])('accepts %j', (value) => {
    expect(isValidDocumentUrl(value)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'ftp://example.com', 'example.com'])('rejects %j', (value) => {
    expect(isValidDocumentUrl(value)).toBe(false);
  });
});

describe('isDocumentFormValid', () => {
  it('accepts a label with no link', () => {
    expect(isDocumentFormValid(validValues)).toBe(true);
  });

  it('rejects a blank label', () => {
    expect(isDocumentFormValid({ ...validValues, title: '   ' })).toBe(false);
  });

  it('rejects a link that is not http(s)', () => {
    expect(isDocumentFormValid({ ...validValues, url: 'javascript:alert(1)' })).toBe(false);
  });
});

describe('buildDocumentRequestPayload', () => {
  it('trims text and sends blank optionals as null', () => {
    expect(
      buildDocumentRequestPayload({ ...validValues, notes: '   ', title: '  CV v3  ', url: ' ' }),
    ).toEqual({ notes: null, submittedAt: null, title: 'CV v3', type: 'CV', url: null });
  });

  it('keeps set values', () => {
    expect(
      buildDocumentRequestPayload({
        notes: ' Sent by email ',
        submittedAt: '2026-05-10',
        title: 'Portfolio',
        type: 'PORTFOLIO',
        url: ' https://example.com ',
      }),
    ).toEqual({
      notes: 'Sent by email',
      submittedAt: '2026-05-10',
      title: 'Portfolio',
      type: 'PORTFOLIO',
      url: 'https://example.com',
    });
  });
});
