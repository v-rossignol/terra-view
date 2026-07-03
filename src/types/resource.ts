import type { ResourceRarity } from '@infinity/shared-config';
import type { BiomeType, HexCoords } from './planet';

export type { ResourceRarity };

export interface HexResource {
  type: string;
  abundance: number;
  rarity: ResourceRarity;
}

export interface PlanetHexResources {
  planetId: string;
  coordinates: HexCoords;
  biome: BiomeType;
  resources: HexResource[];
}
