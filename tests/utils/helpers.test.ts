import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '@utils/helpers';

const createAxiosError = (data: unknown, status = 400): AxiosError => {
  const error = new AxiosError('Request failed', String(status));
  error.response = {
    data,
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new axios.AxiosHeaders() } as InternalAxiosRequestConfig,
  };
  return error;
};

describe('getErrorMessage', () => {
  it('returns a string message from axios errors', () => {
    const error = createAxiosError({ message: 'Unauthorized' });

    expect(getErrorMessage(error, 'fallback')).toBe('Unauthorized');
  });

  it('joins array messages from axios errors', () => {
    const error = createAxiosError({ message: ['a', 'b'] });

    expect(getErrorMessage(error, 'fallback')).toBe('a, b');
  });

  it('returns Error.message for generic errors', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('returns fallback for unknown values', () => {
    expect(getErrorMessage('nope', 'fallback')).toBe('fallback');
  });
});
