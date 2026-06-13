export interface HexCoords {
  q: number;
  r: number;
}

export interface PlanetLocation {
  id: string;
  hex_coords: HexCoords;
}

export interface PlayerLocationOnPlanet {
  cube: { id: string };
  starSystem: { id: string };
  planet: PlanetLocation;
}

export interface Player {
  id: string;
  userId: string;
  location: PlayerLocationOnPlanet | Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnterGameResponse {
  player: Player;
}
