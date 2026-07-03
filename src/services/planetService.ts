import type { Planet } from '../types/planet';
import { dedupedGet } from './api';

export const planetService = {
  getPlanet(planetId: string): Promise<Planet> {
    return dedupedGet<Planet>(`/planets/${planetId}`);
  },
};
