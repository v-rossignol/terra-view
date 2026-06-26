import axios from 'axios';

export const LOGIN_PATH = '/stellar-gate/';

export const UNAUTHORIZED_ERROR_MESSAGE = `You are not signed in. Log in via Stellar Gate (${LOGIN_PATH}).`;

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
