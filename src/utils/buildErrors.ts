import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';
import { getErrorMessage } from './helpers';

const BUILD_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own this unit.',
  404: 'This unit was not found.',
  409: 'This unit is not idle.',
  422: 'This unit cannot build the selected target here.',
};

const DEFAULT_BUILD_ERROR = 'Failed to order unit build.';

export const getBuildErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback = BUILD_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_BUILD_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_BUILD_ERROR);
};
