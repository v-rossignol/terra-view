import type { BiomeType } from '../types/planet';

const BIOME_COLORS: Record<BiomeType, string> = {
  desert: '#c2a645',
  forest: '#2d7a3a',
  ocean: '#1e6f9f',
  mountain: '#6b6b6b',
  ice: '#a8d4e6',
  volcanic: '#8b2500',
};

export function getBiomeColor(biome: BiomeType): string {
  return BIOME_COLORS[biome];
}
