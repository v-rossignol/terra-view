import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import type { UnitUpdatePayload } from '../types/socket';
import type { UnitInstance } from '../types/unit';
import { hasPlanetHex, isPlayerOnPlanet } from './playerLocation';

const DEFAULT_HEX_LOCAL_POSITION: Vec2Local = { x: 0.5, y: 0.5 };

export function getUnitHexCoords(unit: UnitInstance): HexCoords | null {
  if (!isPlayerOnPlanet(unit.location) || !hasPlanetHex(unit.location)) {
    return null;
  }

  return unit.location.planet.hex_coords;
}

export function getUnitHexLocalPosition(unit: UnitInstance): Vec2Local | null {
  if (!isPlayerOnPlanet(unit.location) || !hasPlanetHex(unit.location)) {
    return null;
  }

  return unit.location.planet.position ?? DEFAULT_HEX_LOCAL_POSITION;
}

export function getUnitsSourceSignature(units: UnitInstance[]): string {
  return units.map((unit) => `${unit.id}:${unit.status}:${unit.updatedAt}`).join('|');
}

export function applyUnitUpdate(
  units: UnitInstance[],
  payload: UnitUpdatePayload,
): UnitInstance[] {
  const index = units.findIndex((unit) => unit.id === payload.unitId);
  if (index === -1) {
    return units;
  }

  const unit = units[index];
  const next = [...units];
  next[index] = {
    ...unit,
    status: payload.status,
    location: payload.location,
  };
  return next;
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
