import type { HexCoords, Location, Vec2Local } from './player';

export type UnitCategory = 'vehicule' | 'building';
export type UnitSize = 'small' | 'medium' | 'large';
export type UnitInstanceStatus = 'idle' | 'moving' | 'inactive' | 'active' | 'destroyed';

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
  type: UnitType;
}
