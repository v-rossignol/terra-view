import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { getTransferCargoErrorMessage } from '../../src/utils/transferErrors';

describe('getTransferCargoErrorMessage', () => {
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

    expect(getTransferCargoErrorMessage(error)).toBe('These units cannot transfer cargo right now.');
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
        data: { message: 'Target cargo capacity exceeded (would use 12, max 10)' },
        headers: {},
        config: {} as never,
      },
    );

    expect(getTransferCargoErrorMessage(error)).toBe(
      'Target cargo capacity exceeded (would use 12, max 10)',
    );
  });
});
