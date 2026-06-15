import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playerService } from '../services/playerService';
import { getRelocateErrorMessage } from '../utils/relocateErrors';

export type PlanetRelocateStatus = 'loading' | 'error';

export interface PlanetRelocateState {
  status: PlanetRelocateStatus;
  error: string | null;
}

export const usePlanetRelocate = (planetId: string | undefined): PlanetRelocateState => {
  const navigate = useNavigate();
  const [state, setState] = useState<PlanetRelocateState>({
    status: 'loading',
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const trimmedPlanetId = planetId?.trim();

    if (!trimmedPlanetId) {
      setState({
        status: 'error',
        error: 'Missing planet id.',
      });
      return;
    }

    const relocate = async () => {
      try {
        await playerService.relocateToPlanet(trimmedPlanetId);
        if (cancelled) {
          return;
        }

        navigate('/', { replace: true });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: 'error',
          error: getRelocateErrorMessage(error),
        });
      }
    };

    void relocate();

    return () => {
      cancelled = true;
    };
  }, [navigate, planetId]);

  return state;
};
