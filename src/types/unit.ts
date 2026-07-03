import type { HexCoords, Location, Vec2Local } from './player';
import type { UnitInstanceStatus } from '@infinity/shared-config';

export { UNIT_INSTANCE_STATUSES } from '@infinity/shared-config';
export type { UnitInstanceStatus };

export type UnitCategory = 'vehicule' | 'building';
export type UnitSize = 'small' | 'medium' | 'large';

export type UnitCargo = Record<string, number>;

export interface UnitRecipe {
  ingredients: Record<string, number>;
  work: number;
}

export interface ListBuildableUnitsQuery {
  planetId?: string;
  q?: number;
  r?: number;
}

export interface BuildableUnitType extends UnitType {
  recipe?: UnitRecipe;
  buildDurationMs: number;
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
  resourceType: string;
  amount: number;
}

export interface DropCargoOrderResult {
  unitId: string;
  status: 'idle';
  resourceType: string;
  droppedAmount: number;
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

export interface UnitType {
  id: string;
  name: string;
  type: UnitCategory;
  size: UnitSize;
  mobility: boolean;
  speed: number | null;
  environments: string[];
  rules: Array<{ range: 'hexagon'; value: number }>;
  capabilities: Record<string, unknown>;
  description: string | null;
  metadata: Record<string, unknown>;
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
  type: UnitType;
}
