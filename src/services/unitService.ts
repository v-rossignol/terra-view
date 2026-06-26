import type { UnitInstance } from '../types/unit';
import { api } from './api';

export const unitService = {
  async listPlanetUnits(planetId: string): Promise<UnitInstance[]> {
    const response = await api.get<UnitInstance[]>(`/planets/${encodeURIComponent(planetId)}/units`);
    return response.data;
  },
};
