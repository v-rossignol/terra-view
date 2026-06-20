import type { PlanetHexResources } from '../types/resource';
import { api } from './api';

export const resourceService = {
  async getPlanetHexResources(
    planetId: string,
    q: number,
    r: number,
  ): Promise<PlanetHexResources> {
    const response = await api.get<PlanetHexResources>(
      `/resources/planet/${encodeURIComponent(planetId)}/hex/${q}/${r}`,
    );
    return response.data;
  },
};
