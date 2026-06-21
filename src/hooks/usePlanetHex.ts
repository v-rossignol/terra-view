import { useEffect, useState } from 'react';
import { planetService } from '../services/planetService';
import { resourceService } from '../services/resourceService';
import type { HexCoords, PlanetHexagon } from '../types/planet';
import type { PlanetHexResources } from '../types/resource';
import { getErrorMessage } from '../utils/helpers';
import { isHexInBounds, parseHexCoord } from '../utils/hexCoords';
import { findVisualNeighborHexagons } from '../utils/planetGrid';

export type PlanetHexStatus = 'loading' | 'ready' | 'error';

export interface PlanetHexState {
  status: PlanetHexStatus;
  planetName: string | null;
  planetRadius: number | null;
  coords: HexCoords | null;
  hex: PlanetHexagon | null;
  neighbors: PlanetHexagon[];
  hexResources: PlanetHexResources | null;
  error: string | null;
}

const emptyState = {
  planetName: null as string | null,
  planetRadius: null as number | null,
  coords: null as HexCoords | null,
  hex: null as PlanetHexagon | null,
  neighbors: [] as PlanetHexagon[],
  hexResources: null as PlanetHexResources | null,
  error: null as string | null,
};

export function usePlanetHex(
  planetId: string | undefined,
  qParam: string | undefined,
  rParam: string | undefined,
): PlanetHexState {
  const [state, setState] = useState<PlanetHexState>({
    status: 'loading',
    ...emptyState,
  });

  useEffect(() => {
    let cancelled = false;
    const trimmedPlanetId = planetId?.trim();

    if (!trimmedPlanetId) {
      setState({
        status: 'error',
        ...emptyState,
        error: 'Missing planet id.',
      });
      return;
    }

    const q = parseHexCoord(qParam);
    const r = parseHexCoord(rParam);
    if (q == null || r == null) {
      setState({
        status: 'error',
        ...emptyState,
        error: 'Hex coordinates must be non-negative integers.',
      });
      return;
    }

    const load = async () => {
      setState({
        status: 'loading',
        ...emptyState,
        coords: { q, r },
      });

      try {
        const planet = await planetService.getPlanet(trimmedPlanetId);
        if (cancelled) {
          return;
        }

        if (!isHexInBounds(q, r, planet.radius)) {
          setState({
            status: 'error',
            planetName: planet.name,
            planetRadius: planet.radius,
            coords: { q, r },
            hex: null,
            neighbors: [],
            hexResources: null,
            error: `Hex (${q}, ${r}) is outside this planet's surface.`,
          });
          return;
        }

        const hex = planet.surface?.hexagons.find(
          (cell) => cell.coordinates.q === q && cell.coordinates.r === r,
        );
        if (hex == null) {
          setState({
            status: 'error',
            planetName: planet.name,
            planetRadius: planet.radius,
            coords: { q, r },
            hex: null,
            neighbors: [],
            hexResources: null,
            error: `Hex (${q}, ${r}) was not found on this planet.`,
          });
          return;
        }

        const neighbors = findVisualNeighborHexagons(
          planet.surface?.hexagons,
          { q, r },
          planet.radius,
        );

        let hexResources: PlanetHexResources | null = null;
        try {
          hexResources = await resourceService.getPlanetHexResources(trimmedPlanetId, q, r);
        } catch {
          hexResources = null;
        }

        if (cancelled) {
          return;
        }

        setState({
          status: 'ready',
          planetName: planet.name,
          planetRadius: planet.radius,
          coords: { q, r },
          hex,
          neighbors,
          hexResources,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          status: 'error',
          ...emptyState,
          coords: { q, r },
          error: getErrorMessage(error, 'Failed to load planet hex.'),
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [planetId, qParam, rParam]);

  return state;
}
