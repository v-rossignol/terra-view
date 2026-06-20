import type { PlanetSurface } from './planet';

export type PlanetType = 'rocky' | 'ice' | 'lava';

export interface GeneratePlanetParams {
  seed?: string;
  radius?: number;
  type?: PlanetType;
}

export interface AdminGeneratedPlanetPreview {
  _id: string;
  name: 'Preview Planet';
  type: PlanetType;
  radius: number;
  surface: PlanetSurface;
}
