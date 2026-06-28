import type { TechnicEntry } from '../types/technic';
import { LOGIN_PATH } from './authErrors';

export const TECHNICS = {
  unauthorized: {
    title: 'Sign in required',
    message: 'You are not signed in. Log in via Stellar Gate to continue.',
    actions: [{ label: 'Enter Stellar Gate', href: LOGIN_PATH, external: true, presentation: 'button' }],
  },
  unknown: {
    title: 'Something went wrong',
    message: 'An unexpected problem occurred. Return to Terra View or sign in again.',
    actions: [
      { label: 'Back to Terra View', href: '/', external: false },
      { label: 'Go to Stellar Gate', href: LOGIN_PATH, external: true },
    ],
  },
} as const satisfies Record<string, TechnicEntry>;

export type TechnicCode = keyof typeof TECHNICS;

export function resolveTechnic(code: string | null): TechnicEntry {
  if (code != null && code in TECHNICS) {
    return TECHNICS[code as TechnicCode];
  }

  return TECHNICS.unknown;
}

export function technicsPath(code: TechnicCode): string {
  return `/technics?code=${code}`;
}
