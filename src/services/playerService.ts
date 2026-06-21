import type { CanEnterResponse } from '../types/api';
import type { EnterGameResponse, HexCoords } from '../types/player';
import { api } from './api';

export const playerService = {
  async enterGame(): Promise<EnterGameResponse> {
    const response = await api.post<EnterGameResponse>('/players/me/enter-game');
    return response.data;
  },

  async relocateToPlanet(planetId: string, hex_coords?: HexCoords): Promise<EnterGameResponse> {
    const body: { planetId: string; q?: number; r?: number } = { planetId };
    if (hex_coords != null) {
      body.q = hex_coords.q;
      body.r = hex_coords.r;
    }
    const response = await api.post<EnterGameResponse>('/players/me/location/enter-planet', body);
    return response.data;
  },

  async updatePlanetHex(hex_coords: HexCoords): Promise<EnterGameResponse> {
    const response = await api.patch<EnterGameResponse>('/players/me/location/planet', {
      q: hex_coords.q,
      r: hex_coords.r,
    });
    return response.data;
  },

  async canEnterStarSystem(starSystemId: string): Promise<CanEnterResponse> {
    const response = await api.get<CanEnterResponse>(
      `/players/me/can-enter/system/${starSystemId}`,
    );
    return response.data;
  },
};
