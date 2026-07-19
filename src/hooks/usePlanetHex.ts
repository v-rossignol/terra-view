import { useEffect, useState } from 'react';
import { planetService } from '../services/planetService';
import { playerService } from '../services/playerService';
import { resourceService } from '../services/resourceService';
import { starSystemService } from '../services/starSystemService';
import { unitService } from '../services/unitService';
import type { HexCoords, PlanetHexagon } from '../types/planet';
import type { PlanetHexResources } from '../types/resource';
import type { UnitInstance } from '../types/unit';
import { getErrorMessage } from '../utils/helpers';
import { isUnauthorizedError } from '../utils/authErrors';
import { isHexInBounds, parseHexCoord } from '../utils/hexCoords';
import { findVisualNeighborHexagons } from '../utils/planetGrid';
import { buildHexResourcesByCoords, type HexResourcesByCoords } from '../utils/unitExtraction';

export type PlanetHexStatus = 'loading' | 'ready' | 'error' | 'unauthorized';

export interface PlanetHexState {
  status: PlanetHexStatus;
  planetName: string | null;
  planetRadius: number | null;
  coords: HexCoords | null;
  hex: PlanetHexagon | null;
  neighbors: PlanetHexagon[];
  hexResources: PlanetHexResources | null;
  hexResourcesByCoords: HexResourcesByCoords;
  playerId: string | null;
  playerName: string | null;
  starName: string | null;
  starSystemHref: string | null;
  planetUnits: UnitInstance[];
  error: string | null;
}

const emptyState = {
  planetName: null as string | null,
  planetRadius: null as number | null,
  coords: null as HexCoords | null,
  hex: null as PlanetHexagon | null,
  neighbors: [] as PlanetHexagon[],
  hexResources: null as PlanetHexResources | null,
  hexResourcesByCoords: {} as HexResourcesByCoords,
  playerId: null as string | null,
  playerName: null as string | null,
  starName: null as string | null,
  starSystemHref: null as string | null,
  planetUnits: [] as UnitInstance[],
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
      setState((prev) => ({
        status: 'loading',
        planetName: prev.planetName,
        planetRadius: prev.planetRadius,
        coords: { q, r },
        hex: null,
        neighbors: [],
        hexResources: null,
        hexResourcesByCoords: {},
        playerId: prev.playerId,
        playerName: prev.playerName,
        starName: prev.starName,
        starSystemHref: prev.starSystemHref,
        planetUnits: [],
        error: null,
      }));

      try {
        const [planet, playerSession] = await Promise.all([
          planetService.getPlanet(trimmedPlanetId),
          playerService.getCurrentPlayerSession(),
        ]);
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
        hexResourcesByCoords: {},
            playerId: playerSession?.playerId ?? null,
            playerName: playerSession?.playerName ?? null,
            starName: null,
            starSystemHref: null,
            planetUnits: [],
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
        hexResourcesByCoords: {},
            playerId: playerSession?.playerId ?? null,
            playerName: playerSession?.playerName ?? null,
            starName: null,
            starSystemHref: null,
            planetUnits: [],
            error: `Hex (${q}, ${r}) was not found on this planet.`,
          });
          return;
        }

        const neighbors = findVisualNeighborHexagons(
          planet.surface?.hexagons,
          { q, r },
          planet.radius,
        );

        const resourceCoords = [
          { q, r },
          ...neighbors.map((neighbor) => neighbor.coordinates),
        ];
        const [hexResourceResults, planetUnits, starSystem, canEnter] = await Promise.all([
          Promise.all(
            resourceCoords.map(({ q: resourceQ, r: resourceR }) =>
              resourceService
                .getPlanetHexResources(trimmedPlanetId, resourceQ, resourceR)
                .catch(() => null),
            ),
          ),
          unitService.listPlanetUnits(trimmedPlanetId).catch(() => [] as UnitInstance[]),
          starSystemService.getStarSystem(planet.starSystemId).catch(() => null),
          playerService.canEnterStarSystem(planet.starSystemId).catch(() => ({ canEnter: false })),
        ]);
        const hexResources = hexResourceResults[0] ?? null;
        const hexResourcesByCoords = buildHexResourcesByCoords(hexResourceResults);

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
          hexResourcesByCoords,
          playerId: playerSession?.playerId ?? null,
          playerName: playerSession?.playerName ?? null,
          starName: starSystem?.name ?? null,
          starSystemHref: canEnter.canEnter ? `/solaris/${planet.starSystemId}` : null,
          planetUnits,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedError(error)) {
          setState({
            status: 'unauthorized',
            ...emptyState,
            coords: { q, r },
            error: null,
          });
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
