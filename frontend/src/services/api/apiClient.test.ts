import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import { deleteJson, getJson, postJson, putJson } from './apiClient';

const fallbackErrorMessage = 'Request failed';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends JSON request bodies and parses successful responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'job-001' }), {
        status: 200,
      }),
    );

    await expect(
      postJson('/api/jobs', { company: 'Celonis' }, { fallbackErrorMessage }),
    ).resolves.toEqual({ id: 'job-001' });

    expect(fetch).toHaveBeenCalledWith('/api/jobs', {
      body: JSON.stringify({ company: 'Celonis' }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  });

  it('sends PUT request bodies through the shared client', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ saved: true }), {
        status: 200,
      }),
    );

    await expect(
      putJson('/api/jobs/job-001', { company: 'Miro' }, { fallbackErrorMessage }),
    ).resolves.toEqual({ saved: true });

    expect(fetch).toHaveBeenCalledWith('/api/jobs/job-001', {
      body: JSON.stringify({ company: 'Miro' }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    });
  });

  it('sends requests without a body using default API headers', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([{ id: 'job-001' }]), {
        status: 200,
      }),
    );

    await getJson('/api/jobs', { fallbackErrorMessage });

    expect(fetch).toHaveBeenCalledWith('/api/jobs', {
      body: undefined,
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    });
  });

  it('returns undefined for successful 204 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    await expect(
      deleteJson('/api/jobs/job-001', { fallbackErrorMessage }),
    ).resolves.toBeUndefined();
  });

  it('converts failed API responses into AppError instances', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Backend rejected the request' }), {
        status: 400,
      }),
    );

    await expect(
      getJson('/api/jobs', {
        errorCode: APP_ERROR_CODES.UNKNOWN,
        fallbackErrorMessage,
      }),
    ).rejects.toMatchObject({
      code: APP_ERROR_CODES.UNKNOWN,
      message: 'Backend rejected the request',
    });
  });

  it('reads message fields and fallback messages from failed API responses', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Backend message' }), {
          status: 500,
        }),
      )
      .mockResolvedValueOnce(
        new Response('not json', {
          status: 500,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 500,
        }),
      );

    await expect(
      getJson('/api/jobs', {
        errorCode: APP_ERROR_CODES.UNKNOWN,
        fallbackErrorMessage,
      }),
    ).rejects.toMatchObject({
      message: 'Backend message',
    });

    await expect(
      getJson('/api/jobs', {
        errorCode: APP_ERROR_CODES.UNKNOWN,
        fallbackErrorMessage,
      }),
    ).rejects.toMatchObject({
      message: fallbackErrorMessage,
    });

    await expect(
      getJson('/api/jobs', {
        errorCode: APP_ERROR_CODES.UNKNOWN,
        fallbackErrorMessage,
      }),
    ).rejects.toMatchObject({
      message: fallbackErrorMessage,
    });
  });

  it('uses fallback errors for network failures', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network failed'));

    await expect(
      getJson('/api/jobs', {
        errorCode: APP_ERROR_CODES.UNKNOWN,
        fallbackErrorMessage,
      }),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      getJson('/api/jobs', {
        errorCode: APP_ERROR_CODES.UNKNOWN,
        fallbackErrorMessage,
      }),
    ).rejects.toMatchObject({
      code: APP_ERROR_CODES.UNKNOWN,
      message: fallbackErrorMessage,
    });
  });
});
