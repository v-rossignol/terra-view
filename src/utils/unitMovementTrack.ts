import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import type {
  MoveOrderResult,
  MoveSurfacePoint,
  UnitInstance,
  UnitMovementMetadata,
  UnitMovementTrack,
} from '../types/unit';
import {
  computeMovementProgress,
  computeMovementWorldPosition,
  worldPointToPlanetSurfacePoint,
} from './planetSurfaceTravel';
import { DEFAULT_HEX_LAYOUT } from './hexLayout';
import { getUnitHexCoords, getUnitHexLocalPosition } from './unitLocation';

export function isMovingVehicule(unit: UnitInstance): boolean {
  return unit.status === 'moving' && unit.type.type === 'vehicule';
}

function isHexCoords(value: unknown): value is HexCoords {
  if (value == null || typeof value !== 'object') {
    return false;
  }

  const coords = value as Record<string, unknown>;
  return typeof coords.q === 'number' && typeof coords.r === 'number';
}

function isVec2Local(value: unknown): value is Vec2Local {
  if (value == null || typeof value !== 'object') {
    return false;
  }

  const point = value as Record<string, unknown>;
  return typeof point.x === 'number' && typeof point.y === 'number';
}

export function parseUnitMovementMetadata(
  metadata: Record<string, unknown>,
): UnitMovementMetadata | null {
  const raw = metadata.movement;
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const movement = raw as Record<string, unknown>;
  if (
    !isHexCoords(movement.targetHex) ||
    !isVec2Local(movement.targetPosition) ||
    typeof movement.startedAt !== 'string' ||
    typeof movement.arrivalAt !== 'string'
  ) {
    return null;
  }

  return {
    targetHex: movement.targetHex,
    targetPosition: movement.targetPosition,
    startedAt: movement.startedAt,
    arrivalAt: movement.arrivalAt,
  };
}

export function movementTrackFromMoveOrder(result: MoveOrderResult): UnitMovementTrack {
  return {
    startAt: result.startAt,
    arrivalAt: result.arrivalAt,
    origin: result.origin,
    destination: result.destination,
  };
}

export function buildMovementTrackFromUnit(unit: UnitInstance): UnitMovementTrack | null {
  const movement = parseUnitMovementMetadata(unit.metadata);
  const originHex = getUnitHexCoords(unit);
  const originPosition = getUnitHexLocalPosition(unit);

  if (movement == null || originHex == null || originPosition == null) {
    return null;
  }

  return {
    startAt: movement.startedAt,
    arrivalAt: movement.arrivalAt,
    origin: { hex: originHex, position: originPosition },
    destination: { hex: movement.targetHex, position: movement.targetPosition },
  };
}

export function resolveUnitMovementTrack(
  unit: UnitInstance,
  clientTracks: Readonly<Record<string, UnitMovementTrack>>,
): UnitMovementTrack | null {
  if (!isMovingVehicule(unit)) {
    return null;
  }

  return clientTracks[unit.id] ?? buildMovementTrackFromUnit(unit);
}

export function isMovementVisibleInCluster(
  track: UnitMovementTrack,
  visibleHexKeys: ReadonlySet<string>,
): boolean {
  const isVisible = (point: MoveSurfacePoint) => visibleHexKeys.has(`${point.hex.q},${point.hex.r}`);

  return isVisible(track.origin) || isVisible(track.destination);
}

export function getMovingUnitSurfacePointAtTime(
  track: UnitMovementTrack,
  nowMs: number,
  radius?: number,
): MoveSurfacePoint {
  const progress = computeMovementProgress(track.startAt, track.arrivalAt, nowMs);
  const worldPoint = computeMovementWorldPosition(track.origin, track.destination, progress, radius);

  return worldPointToPlanetSurfacePoint(worldPoint, DEFAULT_HEX_LAYOUT, radius);
}

export function getFollowHexForSelectedMovingUnit(
  selectedUnit: UnitInstance | null,
  movementTracks: Readonly<Record<string, UnitMovementTrack>>,
  currentCoords: HexCoords | null,
  nowMs: number,
  radius?: number,
): HexCoords | null {
  if (selectedUnit == null || currentCoords == null || !isMovingVehicule(selectedUnit)) {
    return null;
  }

  const track = resolveUnitMovementTrack(selectedUnit, movementTracks);
  if (track == null) {
    return null;
  }

  const surface = getMovingUnitSurfacePointAtTime(track, nowMs, radius);
  if (surface.hex.q === currentCoords.q && surface.hex.r === currentCoords.r) {
    return null;
  }

  return surface.hex;
}
