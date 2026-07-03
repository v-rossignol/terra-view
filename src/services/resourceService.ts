import type { PlanetHexResources } from '../types/resource';
import { dedupedGet } from './api';

export const resourceService = {
  getPlanetHexResources(
    planetId: string,
    q: number,
    r: number,
  ): Promise<PlanetHexResources> {
    return dedupedGet<PlanetHexResources>(
      `/resources/planet/${encodeURIComponent(planetId)}/hex/${q}/${r}`,
    );
  },
};
