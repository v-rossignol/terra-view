import type { MoveOrderResult, MoveUnitRequest, UnitInstance } from '../types/unit';
import { api } from './api';

export const unitService = {
  async listPlanetUnits(planetId: string): Promise<UnitInstance[]> {
    const response = await api.get<UnitInstance[]>(`/planets/${encodeURIComponent(planetId)}/units`);
    return response.data;
  },

  async startMove(unitId: string, request: MoveUnitRequest): Promise<MoveOrderResult> {
    const response = await api.post<MoveOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/move`,
      request,
    );
    return response.data;
  },
};
