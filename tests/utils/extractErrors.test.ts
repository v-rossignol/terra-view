import { describe, expect, it } from 'vitest';
import { getExtractErrorMessage, getStopExtractionErrorMessage } from '@utils/extractErrors';

describe('getExtractErrorMessage', () => {
  it('returns server message from axios errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 422,
        data: { message: 'Unit cargo is already full' },
      },
    };

    expect(getExtractErrorMessage(error)).toBe('Unit cargo is already full');
  });

  it('returns a fallback for unknown errors', () => {
    expect(getExtractErrorMessage(new Error('network'))).toBe('network');
  });
});

describe('getStopExtractionErrorMessage', () => {
  it('returns server message from axios errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: 'Unit is not extracting.' },
      },
    };

    expect(getStopExtractionErrorMessage(error)).toBe('Unit is not extracting.');
  });

  it('returns a fallback for unknown errors', () => {
    expect(getStopExtractionErrorMessage(new Error('network'))).toBe('network');
  });
});
