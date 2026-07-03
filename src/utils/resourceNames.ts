import {
  OCCASIONAL_TERRAIN_RESOURCES,
  PERMANENT_TERRAIN_RESOURCES,
} from '@infinity/shared-config';

const TERRAIN_RESOURCE_NAMES: Record<string, string> = (() => {
  const names: Record<string, string> = {};

  for (const entries of Object.values(PERMANENT_TERRAIN_RESOURCES)) {
    for (const entry of entries) {
      names[entry.id] = entry.name;
    }
  }

  for (const entry of OCCASIONAL_TERRAIN_RESOURCES) {
    names[entry.id] = entry.name;
  }

  return names;
})();

export function getTerrainResourceNames(): Record<string, string> {
  return TERRAIN_RESOURCE_NAMES;
}
