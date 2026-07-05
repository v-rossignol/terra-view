import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';
import { getErrorMessage } from './helpers';

const TRANSFER_CARGO_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own one of these units.',
  404: 'One of these units was not found.',
  409: 'These units cannot transfer cargo right now.',
  422: 'These units cannot transfer cargo on this planet.',
};

const DEFAULT_TRANSFER_CARGO_ERROR = 'Failed to transfer cargo.';

export const getTransferCargoErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback =
      TRANSFER_CARGO_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_TRANSFER_CARGO_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_TRANSFER_CARGO_ERROR);
};
