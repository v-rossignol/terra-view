import type { PlayerLocationOnPlanet } from '../types/player';

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
