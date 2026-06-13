import type { Planet } from '../types/planet';
import { api } from './api';

export const planetService = {
  async getPlanet(planetId: string): Promise<Planet> {
    const response = await api.get<Planet>(`/planets/${planetId}`);
    return response.data;
  },
};
