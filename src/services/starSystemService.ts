import type { StarSystem } from '../types/starSystem';
import { dedupedGet } from './api';

export const starSystemService = {
  getStarSystem(systemId: string): Promise<StarSystem> {
    return dedupedGet<StarSystem>(`/systems/${systemId}`);
  },
};
