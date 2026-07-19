import type { BuildingZoneId } from '@infinity/shared-config';
import type { HexCoords } from './planet';

export type { HexCoords };

export interface Vec2Local {
  x: number;
  y: number;
}

export interface Vec3Local {
  x: number;
  y: number;
  z: number;
}

export interface CubeIdentity {
  id: string;
}

export interface CubeLocation extends CubeIdentity {
  position: Vec3Local;
}

export interface StarSystemIdentity {
  id: string;
}

export interface StarSystemLocation extends StarSystemIdentity {
  position: Vec2Local;
}

export interface PlanetLocation {
  id: string;
  hex_coords?: HexCoords;
  position?: Vec2Local;
  /** Set for immobile building units — authoritative slot within the hex. */
  buildingZoneId?: BuildingZoneId;
}

export interface PlayerLocationOnPlanet {
  cube: CubeIdentity;
  starSystem: StarSystemIdentity;
  planet: PlanetLocation;
}

export interface PlayerLocationInStarSystem {
  cube: CubeIdentity;
  starSystem: StarSystemLocation;
}

export interface PlayerLocationInCube {
  cube: CubeLocation;
}

export type Location =
  | PlayerLocationInCube
  | PlayerLocationInStarSystem
  | PlayerLocationOnPlanet;

export interface Player {
  id: string;
  userId: string;
  location: Location | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnterGameResponse {
  player: Player;
}
