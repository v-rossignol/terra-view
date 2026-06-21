import { useEffect, useState } from 'react';
import axios from 'axios';
import { authService } from '../services/authService';
import { playerService } from '../services/playerService';
import { planetService } from '../services/planetService';
import { starSystemService } from '../services/starSystemService';
import type { HexCoords, Planet } from '../types/planet';
import { getErrorMessage } from '../utils/helpers';
import { rollRandomHex } from '../utils/planetGrid';
import { hasPlanetHex, isPlayerOnPlanet } from '../utils/playerLocation';

export type FirstPageStatus = 'loading' | 'ready' | 'error';

export interface FirstPageState {
  status: FirstPageStatus;
  playerName: string | null;
  starName: string | null;
  starSystemHref: string | null;
  planetName: string | null;
  planet: Planet | null;
  playerHex: HexCoords | null;
  error: string | null;
}

const LOGIN_PATH = '/stellar-gate/';

export const useFirstPageBootstrap = (): FirstPageState => {
  const [state, setState] = useState<FirstPageState>({
    status: 'loading',
    playerName: null,
    starName: null,
    starSystemHref: null,
    planetName: null,
    planet: null,
    playerHex: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (cancelled) {
          return;
        }

        const { player } = await playerService.enterGame();
        if (cancelled) {
          return;
        }

        if (!player) {
          setState({
            status: 'error',
            playerName: null,
            starName: null,
            starSystemHref: null,
            planetName: null,
            planet: null,
            playerHex: null,
            error: 'No player profile found. Enter the game from Stellar Gate first.',
          });
          return;
        }

        if (!isPlayerOnPlanet(player.location)) {
          setState({
            status: 'error',
            playerName: user.username,
            starName: null,
            starSystemHref: null,
            planetName: null,
            planet: null,
            playerHex: null,
            error:
              'Your player is not on a planet surface. Travel to a planet before opening Terra View.',
          });
          return;
        }

        const planet = await planetService.getPlanet(player.location.planet.id);
        if (cancelled) {
          return;
        }

        let playerHex = hasPlanetHex(player.location) ? player.location.planet.hex_coords : null;

        if (playerHex == null) {
          const { player: updatedPlayer } = await playerService.updatePlanetHex(
            rollRandomHex(planet.radius),
          );
          if (cancelled) {
            return;
          }

          if (!isPlayerOnPlanet(updatedPlayer.location) || !hasPlanetHex(updatedPlayer.location)) {
            setState({
              status: 'error',
              playerName: user.username,
              starName: null,
              starSystemHref: null,
              planetName: null,
              planet: null,
              playerHex: null,
              error: 'Unable to select a starting hex on this planet.',
            });
            return;
          }

          playerHex = updatedPlayer.location.planet.hex_coords;
        }

        const [starSystem, canEnter] = await Promise.all([
          starSystemService.getStarSystem(planet.starSystemId),
          playerService.canEnterStarSystem(planet.starSystemId),
        ]);
        if (cancelled) {
          return;
        }

        setState({
          status: 'ready',
          playerName: user.username,
          starName: starSystem.name,
          starSystemHref: canEnter.canEnter ? `/solaris/${planet.starSystemId}` : null,
          planetName: planet.name,
          planet,
          playerHex,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setState({
            status: 'error',
            playerName: null,
            starName: null,
            starSystemHref: null,
            planetName: null,
            planet: null,
            playerHex: null,
            error: `You are not signed in. Log in via Stellar Gate (${LOGIN_PATH}).`,
          });
          return;
        }

        setState({
          status: 'error',
          playerName: null,
          starName: null,
          starSystemHref: null,
          planetName: null,
          planet: null,
          playerHex: null,
          error: getErrorMessage(error, 'Failed to load player or planet data.'),
        });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
