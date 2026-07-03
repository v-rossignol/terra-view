import { PERMANENT_TERRAIN_RESOURCES, type HexBiome } from '@infinity/shared-config';
import { isResourceTypeAllowed } from '@infinity/shared-utils';
import type { BiomeType } from '../types/planet';

export interface BiomeResourceEntry {
  id: string;
  name: string;
  quantity: number;
}

export function getPermanentBiomeResources(biome: BiomeType): BiomeResourceEntry[] {
  return PERMANENT_TERRAIN_RESOURCES[biome as HexBiome].map((entry) => ({
    id: entry.id,
    name: entry.name,
    quantity: entry.quantity,
  }));
}

export function getExtractableBiomeResources(
  biome: BiomeType,
  extractionTypes: readonly string[],
): BiomeResourceEntry[] {
  const biomeResources = getPermanentBiomeResources(biome);

  return biomeResources.filter((resource) =>
    isResourceTypeAllowed([...extractionTypes], resource.id),
  );
}
