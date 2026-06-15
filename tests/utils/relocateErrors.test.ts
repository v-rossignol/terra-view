import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { getRelocateErrorMessage } from '@utils/relocateErrors';

const createAxiosError = (status: number, message?: string): AxiosError => {
  const error = new AxiosError('Request failed', String(status));
  error.response = {
    data: message != null ? { message } : {},
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new axios.AxiosHeaders() } as InternalAxiosRequestConfig,
  };
  return error;
};

describe('getRelocateErrorMessage', () => {
  it('returns server message when present', () => {
    const error = createAxiosError(403, 'Faction access denied');

    expect(getRelocateErrorMessage(error)).toBe('Faction access denied');
  });

  it('returns a 409 fallback when the server sends no message', () => {
    expect(getRelocateErrorMessage(createAxiosError(409))).toBe(
      'You cannot travel there from your current location.',
    );
  });

  it('returns a 403 fallback when the server sends no message', () => {
    expect(getRelocateErrorMessage(createAxiosError(403))).toBe(
      'You are not allowed to travel to this planet.',
    );
  });

  it('returns a generic fallback for unknown errors', () => {
    expect(getRelocateErrorMessage(new Error('network down'))).toBe('network down');
  });
});
