import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { getUnparkErrorMessage } from '../../src/utils/parkErrors';

describe('getUnparkErrorMessage', () => {
  it('returns a fallback for a 409 conflict', () => {
    const error = new axios.AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        data: {},
        headers: {},
        config: {} as never,
      },
    );

    expect(getUnparkErrorMessage(error)).toBe('This unit is not parked.');
  });

  it('returns the server message when present', () => {
    const error = new axios.AxiosError(
      'Unprocessable',
      '422',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: { message: 'Unit has no valid parking metadata' },
        headers: {},
        config: {} as never,
      },
    );

    expect(getUnparkErrorMessage(error)).toBe('Unit has no valid parking metadata');
  });
});
