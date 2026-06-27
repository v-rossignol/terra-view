import type { Location } from './player';
import type { UnitInstanceStatus } from './unit';

export const SOCKET_EVENTS = {
  PLANET_JOIN: 'PLANET_JOIN',
  PLANET_LEAVE: 'PLANET_LEAVE',
  PLANET_UPDATE: 'PLANET_UPDATE',
  UNIT_UPDATE: 'UNIT_UPDATE',
} as const;

export interface UnitUpdatePayload {
  unitId: string;
  status: UnitInstanceStatus;
  location: Location;
}

export interface PlanetUpdatePayload {
  playerId: string;
  planetId: string;
  q: number;
  r: number;
}
