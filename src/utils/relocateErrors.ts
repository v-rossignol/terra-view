import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';
import { getErrorMessage } from './helpers';

const RELOCATE_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You are not allowed to travel to this planet.',
  404: 'This planet was not found.',
  409: 'You cannot travel there from your current location.',
  422: 'This planet has no enterable surface.',
};

const DEFAULT_RELOCATE_ERROR = 'Failed to relocate to this planet.';

export const getRelocateErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback = RELOCATE_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_RELOCATE_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_RELOCATE_ERROR);
};
