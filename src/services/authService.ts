import type { User } from '../types/auth';
import { dedupedGet } from './api';

export const authService = {
  getCurrentUser(): Promise<User> {
    return dedupedGet<User>('/auth/me');
  },
};
