import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';
import { getErrorMessage } from './helpers';

const EXTRACT_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own this unit.',
  404: 'This unit was not found.',
  409: 'This unit cannot start extraction right now.',
  422: 'This unit cannot extract that resource.',
};

const DEFAULT_EXTRACT_ERROR = 'Failed to start extraction.';

const STOP_EXTRACTION_ERROR_FALLBACKS: Record<number, string> = {
  401: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
  403: 'You do not own this unit.',
  404: 'This unit was not found.',
  409: 'This unit is not extracting.',
  422: 'This unit cannot stop extraction on this planet.',
};

const DEFAULT_STOP_EXTRACTION_ERROR = 'Failed to stop extraction.';

export const getExtractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback = EXTRACT_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_EXTRACT_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_EXTRACT_ERROR);
};

export const getStopExtractionErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    const fallback =
      STOP_EXTRACTION_ERROR_FALLBACKS[error.response.status] ?? DEFAULT_STOP_EXTRACTION_ERROR;
    const data = error.response.data as NestJsErrorResponse | undefined;

    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }

    return fallback;
  }

  return getErrorMessage(error, DEFAULT_STOP_EXTRACTION_ERROR);
};
