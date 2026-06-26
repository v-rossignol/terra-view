import type { HexCoords } from '../types/planet';
import type { UnitInstance } from '../types/unit';
import { hasPlanetHex, isPlayerOnPlanet } from './playerLocation';

export function getUnitHexCoords(unit: UnitInstance): HexCoords | null {
  if (!isPlayerOnPlanet(unit.location) || !hasPlanetHex(unit.location)) {
    return null;
  }

  return unit.location.planet.hex_coords;
}

export function groupUnitsByHex(units: UnitInstance[]): Map<string, UnitInstance[]> {
  const grouped = new Map<string, UnitInstance[]>();

  for (const unit of units) {
    if (unit.status === 'destroyed') {
      continue;
    }

    const coords = getUnitHexCoords(unit);
    if (coords == null) {
      continue;
    }

    const key = `${coords.q},${coords.r}`;
    const existing = grouped.get(key) ?? [];
    existing.push(unit);
    grouped.set(key, existing);
  }

  return grouped;
}
