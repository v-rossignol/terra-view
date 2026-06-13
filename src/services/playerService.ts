import type { EnterGameResponse } from '../types/player';
import { api } from './api';

export const playerService = {
  async enterGame(): Promise<EnterGameResponse> {
    const response = await api.post<EnterGameResponse>('/players/me/enter-game');
    return response.data;
  },
};
