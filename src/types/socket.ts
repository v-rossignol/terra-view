import { PLANET_EVENTS, UNIT_EVENTS } from '@infinity/shared-config';
import type { Location } from './player';
import type { UnitGarage } from '@infinity/shared-utils';
import type { UnitCargo, UnitInstanceStatus } from './unit';

export const SOCKET_EVENTS = {
  PLANET_JOIN: PLANET_EVENTS.JOIN,
  PLANET_LEAVE: PLANET_EVENTS.LEAVE,
  PLANET_UPDATE: PLANET_EVENTS.UPDATE,
  UNIT_UPDATE: UNIT_EVENTS.UPDATE,
} as const;

export interface UnitUpdatePayload {
  unitId: string;
  status: UnitInstanceStatus;
  location: Location;
  /** Present on extraction tick/stop events. */
  cargo?: UnitCargo;
  /** Client-side merge when starting extraction locally. */
  metadata?: Record<string, unknown>;
  /** Present when vehicles are parked in or removed from a garage building. */
  garage?: UnitGarage;
}

export interface PlanetUpdatePayload {
  playerId: string;
  planetId: string;
  q: number;
  r: number;
}
