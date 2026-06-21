import type { HexCoords, PlayerLocationOnPlanet } from '../types/player';

export const isPlayerOnPlanet = (
  location: unknown,
): location is PlayerLocationOnPlanet => {
  if (location == null || typeof location !== 'object') {
    return false;
  }

  const planet = (location as PlayerLocationOnPlanet).planet;
  return (
    typeof planet === 'object' &&
    planet != null &&
    typeof planet.id === 'string' &&
    planet.id.length > 0
  );
};

export const hasPlanetHex = (
  location: PlayerLocationOnPlanet,
): location is PlayerLocationOnPlanet & {
  planet: { id: string; hex_coords: HexCoords };
} => {
  const { hex_coords } = location.planet;
  return (
    hex_coords != null &&
    typeof hex_coords.q === 'number' &&
    typeof hex_coords.r === 'number'
  );
};
