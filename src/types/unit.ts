import type { Location } from './player';

export type UnitCategory = 'vehicule' | 'building';
export type UnitSize = 'small' | 'medium' | 'large';
export type UnitInstanceStatus = 'inactive' | 'active' | 'destroyed';

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
