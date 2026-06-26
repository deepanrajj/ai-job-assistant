import {
  createApiError,
  createFetchOptions,
  createRequestError,
  parseJsonResponse,
} from './api.utils';
import { AppError } from '../../errors';
import type { IApiErrorOptions, IApiRequestConfig } from './api.types';

/**
 * Executes a JSON API request and converts failures into AppError instances.
 *
 * @param {string} url API endpoint URL.
 * @param {IApiRequestConfig<TBody>} config Request method, optional body, and error mapping options.
 * @returns {Promise<TResponse>} Parsed API response body.
 */
export const requestJson = async <TResponse, TBody = undefined>(
  url: string,
  config: IApiRequestConfig<TBody>,
): Promise<TResponse> => {
  try {
    const response = await fetch(url, createFetchOptions(config));

    if (!response.ok) {
      throw await createApiError(response, config);
    }

    return parseJsonResponse<TResponse>(response);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw createRequestError(config);
  }
};

/**
 * Sends a GET request through the shared JSON API client.
 *
 * @param {string} url API endpoint URL.
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {Promise<TResponse>} Parsed API response body.
 */
export const getJson = <TResponse>(url: string, options: IApiErrorOptions): Promise<TResponse> =>
  requestJson<TResponse>(url, {
    ...options,
    method: 'GET',
  });

/**
 * Sends a POST request through the shared JSON API client.
 *
 * @param {string} url API endpoint URL.
 * @param {TBody} body JSON request body.
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {Promise<TResponse>} Parsed API response body.
 */
export const postJson = <TResponse, TBody>(
  url: string,
  body: TBody,
  options: IApiErrorOptions,
): Promise<TResponse> =>
  requestJson<TResponse, TBody>(url, {
    ...options,
    body,
    method: 'POST',
  });

/**
 * Sends a PUT request through the shared JSON API client.
 *
 * @param {string} url API endpoint URL.
 * @param {TBody} body JSON request body.
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {Promise<TResponse>} Parsed API response body.
 */
export const putJson = <TResponse, TBody>(
  url: string,
  body: TBody,
  options: IApiErrorOptions,
): Promise<TResponse> =>
  requestJson<TResponse, TBody>(url, {
    ...options,
    body,
    method: 'PUT',
  });

/**
 * Sends a DELETE request through the shared JSON API client.
 *
 * @param {string} url API endpoint URL.
 * @param {IApiErrorOptions} options Error mapping options for the request.
 * @returns {Promise<TResponse>} Parsed API response body.
 */
export const deleteJson = <TResponse>(url: string, options: IApiErrorOptions): Promise<TResponse> =>
  requestJson<TResponse>(url, {
    ...options,
    method: 'DELETE',
  });
