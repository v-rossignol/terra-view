import type { CanEnterResponse } from '../types/api';
import type { EnterGameResponse, HexCoords, Player } from '../types/player';
import { isUnauthorizedError } from '../utils/authErrors';
import { authService } from './authService';
import { api, dedupedGet } from './api';

export const playerService = {
  async enterGame(): Promise<EnterGameResponse> {
    const response = await api.post<EnterGameResponse>('/players/me/enter-game');
    return response.data;
  },

  getPlayerByUserId(userId: string): Promise<Player> {
    return dedupedGet<Player>(`/players/${encodeURIComponent(userId)}`);
  },

  async getCurrentPlayerSession(): Promise<{ playerId: string; playerName: string } | null> {
    try {
      const user = await authService.getCurrentUser();
      const player = await this.getPlayerByUserId(user.id);
      return { playerId: player.id, playerName: user.username };
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw error;
      }
      return null;
    }
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

  canEnterStarSystem(starSystemId: string): Promise<CanEnterResponse> {
    return dedupedGet<CanEnterResponse>(`/players/me/can-enter/system/${starSystemId}`);
  },
};
