import type { CanEnterResponse } from '../types/api';
import type { EnterGameResponse, HexCoords } from '../types/player';
import { api } from './api';

const DEFAULT_RELOCATE_HEX: HexCoords = { q: 0, r: 0 };

export const playerService = {
  async enterGame(): Promise<EnterGameResponse> {
    const response = await api.post<EnterGameResponse>('/players/me/enter-game');
    return response.data;
  },

  async relocateToPlanet(
    planetId: string,
    hex_coords: HexCoords = DEFAULT_RELOCATE_HEX,
  ): Promise<EnterGameResponse> {
    const response = await api.post<EnterGameResponse>('/players/me/location/enter-planet', {
      planetId,
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
