import type { BiomeType, HexCoords } from './planet';

export type ResourceRarity = 'common' | 'rare' | 'epic' | 'legendary';

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
