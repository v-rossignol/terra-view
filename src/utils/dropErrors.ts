import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';
import { getErrorMessage } from './helpers';

const DROP_CARGO_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own this unit.',
  404: 'This unit was not found.',
  409: 'This unit cannot drop cargo right now.',
  422: 'This unit cannot drop that resource on this planet.',
};

const DEFAULT_DROP_CARGO_ERROR = 'Failed to drop cargo.';

export const getDropCargoErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback = DROP_CARGO_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_DROP_CARGO_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_DROP_CARGO_ERROR);
};
