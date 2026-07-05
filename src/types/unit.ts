import type { UnitInstanceStatus } from '@infinity/shared-config';

export { UNIT_INSTANCE_STATUSES } from '@infinity/shared-config';
export type { UnitCategory, UnitInstanceStatus, UnitSize } from '@infinity/shared-config';
export type { UnitCargo } from '@infinity/shared-utils';
export type {
  BuildableUnitType,
  CargoResource,
  UnitRecipe,
  UnitTypeDefinition,
} from '@infinity/shared-types';

import type { HexCoords, Location, Vec2Local } from './player';
import type { UnitCargo, UnitGarage } from '@infinity/shared-utils';
import type { CargoResource, UnitTypeDefinition } from '@infinity/shared-types';

/** Alias kept for existing terra-view imports; same shape as {@link UnitTypeDefinition}. */
export type UnitType = UnitTypeDefinition;

export interface ListBuildableUnitsQuery {
  planetId?: string;
  q?: number;
  r?: number;
}

export interface MoveUnitRequest {
  planetId: string;
  targetHex: HexCoords;
  targetPosition?: Vec2Local;
}

export interface MoveSurfacePoint {
  hex: HexCoords;
  position: Vec2Local;
}

export interface MoveOrderResult {
  unitId: string;
  status: 'moving';
  startAt: string;
  arrivalAt: string;
  origin: MoveSurfacePoint;
  destination: MoveSurfacePoint;
  distance: number;
}

export interface StopUnitRequest {
  planetId: string;
}

export interface StopOrderResult {
  unitId: string;
  status: 'idle';
}

export interface ExtractUnitRequest {
  planetId: string;
  resourceType: string;
}

export interface ExtractOrderResult {
  unitId: string;
  status: 'extracting';
  resourceType: string;
  startedAt: string;
}

export interface StopExtractionOrderResult {
  unitId: string;
  status: 'idle';
  extractedAmount: number;
}

export interface DropCargoRequest {
  planetId: string;
  resource: CargoResource;
}

export interface DropCargoOrderResult {
  unitId: string;
  status: 'idle';
  resource: CargoResource;
}

export interface BuildUnitRequest {
  planetId: string;
  targetTypeId: string;
  targetHex: HexCoords;
  targetPosition?: Vec2Local;
}

export interface BuildOrderResult {
  unitId: string;
  status: 'building';
  targetTypeId: string;
  startedAt: string;
  completedAt: string;
}

export interface StopBuildOrderResult {
  unitId: string;
  status: 'idle';
}

export interface ParkUnitRequest {
  planetId: string;
  garageUnitId: string;
}

export interface ParkOrderResult {
  unitId: string;
  status: 'inactive';
  garageUnitId: string;
}

export interface UnparkOrderResult {
  unitId: string;
  status: 'idle';
}

export interface TransferCargoRequest {
  planetId: string;
  targetUnitId: string;
  resources: CargoResource[];
}

export interface TransferCargoOrderResult {
  sourceUnitId: string;
  targetUnitId: string;
  transferred: CargoResource[];
}

/** Server-persisted movement state (`unit.metadata.movement`). */
export interface UnitMovementMetadata {
  targetHex: HexCoords;
  targetPosition: Vec2Local;
  startedAt: string;
  arrivalAt: string;
}

/** Client-side timeline for animating a unit between two surface points. */
export interface UnitMovementTrack {
  startAt: string;
  arrivalAt: string;
  origin: MoveSurfacePoint;
  destination: MoveSurfacePoint;
}

export interface UnitInstance {
  id: string;
  typeId: string;
  ownerId: string;
  location: Location;
  status: UnitInstanceStatus;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  cargo: UnitCargo;
  garage: UnitGarage;
  type: UnitTypeDefinition;
}
