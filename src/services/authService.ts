import type { User } from '../types/auth';
import { api } from './api';

export const authService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};
