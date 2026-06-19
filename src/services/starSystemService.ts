import type { StarSystem } from '../types/starSystem';
import { api } from './api';

export const starSystemService = {
  async getStarSystem(systemId: string): Promise<StarSystem> {
    const response = await api.get<StarSystem>(`/galaxy/systems/${systemId}`);
    return response.data;
  },
};
