import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';
import { getErrorMessage } from './helpers';

const PARK_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own this unit or garage.',
  404: 'This unit or garage was not found.',
  409: 'This unit is already parked or the garage is busy.',
  422: 'This vehicle cannot park in that garage.',
};

const DEFAULT_PARK_ERROR = 'Failed to park unit.';

export const getParkErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback = PARK_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_PARK_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_PARK_ERROR);
};

const UNPARK_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own this unit.',
  404: 'This unit was not found.',
  409: 'This unit is not parked.',
  422: 'This unit has no valid parking metadata or is not on the specified planet.',
};

const DEFAULT_UNPARK_ERROR = 'Failed to unpark unit.';

export const getUnparkErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback = UNPARK_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_UNPARK_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_UNPARK_ERROR);
};
