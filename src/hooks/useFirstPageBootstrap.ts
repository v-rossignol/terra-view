import { useEffect, useState } from 'react';
import axios from 'axios';
import { authService } from '../services/authService';
import { playerService } from '../services/playerService';
import { planetService } from '../services/planetService';
import { getErrorMessage } from '../utils/helpers';
import { isPlayerOnPlanet } from '../utils/playerLocation';

export type FirstPageStatus = 'loading' | 'ready' | 'error';

export interface FirstPageState {
  status: FirstPageStatus;
  playerName: string | null;
  planetName: string | null;
  error: string | null;
}

const LOGIN_PATH = '/stellar-gate/';

export const useFirstPageBootstrap = (): FirstPageState => {
  const [state, setState] = useState<FirstPageState>({
    status: 'loading',
    playerName: null,
    planetName: null,
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
            planetName: null,
            error: 'No player profile found. Enter the game from Stellar Gate first.',
          });
          return;
        }

        if (!isPlayerOnPlanet(player.location)) {
          setState({
            status: 'error',
            playerName: user.username,
            planetName: null,
            error:
              'Your player is not on a planet surface. Travel to a planet before opening Terra View.',
          });
          return;
        }

        const planet = await planetService.getPlanet(player.location.planet.id);
        if (cancelled) {
          return;
        }

        setState({
          status: 'ready',
          playerName: user.username,
          planetName: planet.name,
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
            planetName: null,
            error: `You are not signed in. Log in via Stellar Gate (${LOGIN_PATH}).`,
          });
          return;
        }

        setState({
          status: 'error',
          playerName: null,
          planetName: null,
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
