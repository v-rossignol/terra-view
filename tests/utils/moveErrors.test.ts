import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { getMoveErrorMessage } from '@utils/moveErrors';

describe('getMoveErrorMessage', () => {
  it('returns server message when present', () => {
    const error = new axios.AxiosError(
      'Request failed',
      '422',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: { statusCode: 422, message: 'Target hex is out of range.' },
      },
    );

    expect(getMoveErrorMessage(error)).toBe('Target hex is out of range.');
  });

  it('returns a fallback for known status codes', () => {
    const error = new axios.AxiosError(
      'Request failed',
      '409',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
        data: { statusCode: 409, message: '' },
      },
    );

    expect(getMoveErrorMessage(error)).toBe('This unit is already moving.');
  });
});
