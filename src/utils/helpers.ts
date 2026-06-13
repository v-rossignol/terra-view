import axios from 'axios';
import type { NestJsErrorResponse } from '../types/api';

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as NestJsErrorResponse | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
