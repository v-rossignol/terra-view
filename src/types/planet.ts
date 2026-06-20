export type BiomeType = 'desert' | 'forest' | 'ocean' | 'mountain' | 'ice' | 'volcanic' | 'plain';

export interface HexCoords {
  q: number;
  r: number;
}

export interface PlanetHexagon {
  biome: BiomeType;
  resources: unknown[];
  dangerLevel: number;
  coordinates: HexCoords;
}

export interface PlanetSurface {
  hexagons: PlanetHexagon[];
  generatedAt: string;
}

export interface Planet {
  _id: string;
  name: string;
  starSystemId: string;
  type: string;
  radius: number;
  surface?: PlanetSurface;
}
