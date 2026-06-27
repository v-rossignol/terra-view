import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanetHexPage } from '@components/PlanetHexPage';
import type { UnitInstance } from '../../src/types/unit';
import type { UnitUpdatePayload } from '../../src/types/socket';

let latestPatchUnit: ((payload: UnitUpdatePayload) => void) | null = null;

vi.mock('@hooks/usePlanetSocket', async () => {
  const React = await import('react');
  const { applyUnitUpdate } = await import('@utils/unitLocation');

  return {
    usePlanetUnitsWithSocket: (
      _planetId: string | undefined,
      sourceUnits: UnitInstance[],
      onUnitUpdate?: (payload: UnitUpdatePayload) => void,
    ) => {
      const [units, setUnits] = React.useState(sourceUnits);

      React.useEffect(() => {
        setUnits(sourceUnits);
      }, [sourceUnits]);

      const patchUnit = React.useCallback((payload: UnitUpdatePayload) => {
        setUnits((current) => applyUnitUpdate(current, payload));
        onUnitUpdate?.(payload);
      }, [onUnitUpdate]);

      latestPatchUnit = patchUnit;

      return { units, patchUnit };
    },
  };
});

vi.mock('@hooks/usePlanetHex', () => ({
  usePlanetHex: vi.fn(),
}));

vi.mock('@components/game/SingleHexView', () => ({
  SingleHexView: ({
    onUnitSelect,
    onMoveDestinationSelect,
    planetUnits = [],
    pendingMoveDestination = null,
  }: {
    onUnitSelect?: (unit: UnitInstance) => void;
    onMoveDestinationSelect?: (hex_coords: { q: number; r: number }, position: { x: number; y: number }) => void;
    planetUnits?: UnitInstance[];
    pendingMoveDestination?: { hex_coords: { q: number; r: number }; position: { x: number; y: number } } | null;
  }) => (
    <>
      <button
        type="button"
        data-testid="select-unit"
        onClick={() => {
          if (planetUnits[0] != null) {
            onUnitSelect?.(planetUnits[0]);
          }
        }}
      >
        Select unit
      </button>
      <button
        type="button"
        data-testid="select-move-destination"
        onClick={() => onMoveDestinationSelect?.({ q: 2, r: 4 }, { x: 0.4, y: 0.6 })}
      >
        Select destination
      </button>
      {pendingMoveDestination != null ? (
        <div data-testid="pending-move-destination">Destination marker</div>
      ) : null}
    </>
  ),
}));

vi.mock('@services/unitService', () => ({
  unitService: {
    startMove: vi.fn(),
    stopUnit: vi.fn(),
  },
}));

import { usePlanetHex } from '@hooks/usePlanetHex';
import { unitService } from '@services/unitService';

const mockedHook = vi.mocked(usePlanetHex);
const mockedStartMove = vi.mocked(unitService.startMove);
const mockedStopUnit = vi.mocked(unitService.stopUnit);

const mobileUnit = {
  id: 'unit-1',
  typeId: 'scout-x1',
  ownerId: 'player-1',
  location: {
    cube: { id: 'cube-1' },
    starSystem: { id: 'system-1' },
    planet: { id: 'planet-1', hex_coords: { q: 2, r: 3 } },
  },
  status: 'idle' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {},
  type: {
    id: 'scout-x1',
    name: 'Scout X1',
    type: 'vehicule' as const,
    size: 'small' as const,
    mobility: true,
    speed: 2,
    environments: ['forest', 'ocean'],
    rules: [{ range: 'hexagon' as const, value: 1 }],
    capabilities: {},
    description: null,
    metadata: {},
  },
};

describe('PlanetHexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestPatchUnit = null;
  });

  it('shows a loading state while fetching the hex', () => {
    mockedHook.mockReturnValue({
      status: 'loading',
      planetName: null,
      planetRadius: null,
      coords: null,
      hex: null,
      neighbors: [],
      hexResources: null,
      playerId: null,
      playerName: null,
      starName: null,
      starSystemHref: null,
      planetUnits: [],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading hex…')).toBeInTheDocument();
  });

  it('shows the hex and resource panel when ready', () => {
    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [
        {
          biome: 'ocean',
          resources: [],
          dangerLevel: 1,
          coordinates: { q: 2, r: 4 },
        },
      ],
      hexResources: {
        planetId: 'planet-1',
        coordinates: { q: 2, r: 3 },
        biome: 'forest',
        resources: [],
      },
      playerId: 'player-1',
      playerName: 'Ada',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetUnits: [],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Ada');
    expect(screen.getByRole('banner')).toHaveTextContent('Astra Prime');
    expect(screen.getByRole('link', { name: 'Astra Prime' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('banner')).toHaveTextContent('Hex (2, 3)');
    expect(screen.getByTestId('select-move-destination')).toBeInTheDocument();
    expect(screen.getByText('Danger level: 4')).toBeInTheDocument();
    expect(screen.getByText('No resources on this hex.')).toBeInTheDocument();
  });

  it('shows a Stellar Gate link when the session is missing', () => {
    mockedHook.mockReturnValue({
      status: 'error',
      planetName: null,
      planetRadius: null,
      coords: { q: 2, r: 3 },
      hex: null,
      neighbors: [],
      hexResources: null,
      playerId: null,
      playerName: null,
      starName: null,
      starSystemHref: null,
      planetUnits: [],
      error: 'You are not signed in. Log in via Stellar Gate (/stellar-gate/).',
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('not signed in');
    expect(screen.getByRole('link', { name: 'Go to Stellar Gate' })).toHaveAttribute(
      'href',
      '/stellar-gate/',
    );
    expect(screen.queryByRole('link', { name: 'Back to planet surface' })).not.toBeInTheDocument();
  });

  it('shows an error and back link when loading fails', () => {
    mockedHook.mockReturnValue({
      status: 'error',
      planetName: null,
      planetRadius: null,
      coords: { q: 2, r: 3 },
      hex: null,
      neighbors: [],
      hexResources: null,
      playerId: null,
      playerName: null,
      starName: null,
      starSystemHref: null,
      planetUnits: [],
      error: 'Hex (2, 3) is outside this planet\'s surface.',
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('outside this planet');
    expect(screen.getByRole('link', { name: 'Back to planet surface' })).toHaveAttribute('href', '/');
  });

  it('orders a move when a destination is selected in move mode', async () => {
    mockedStartMove.mockResolvedValue({
      unitId: 'unit-1',
      status: 'moving',
      startAt: '2026-01-01T00:00:00.000Z',
      arrivalAt: '2026-01-01T00:05:00.000Z',
      origin: { hex: { q: 2, r: 3 }, position: { x: 0.35, y: 0.72 } },
      destination: { hex: { q: 2, r: 4 }, position: { x: 0.4, y: 0.6 } },
      distance: 0.739,
    });

    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [
        {
          biome: 'ocean',
          resources: [],
          dangerLevel: 1,
          coordinates: { q: 2, r: 4 },
        },
      ],
      hexResources: null,
      playerId: 'player-1',
      playerName: 'Ada',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetUnits: [mobileUnit],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('select-unit'));
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    fireEvent.click(screen.getByTestId('select-move-destination'));

    await waitFor(() => {
      expect(mockedStartMove).toHaveBeenCalledWith('unit-1', {
        planetId: 'planet-1',
        targetHex: { q: 2, r: 4 },
        targetPosition: { x: 0.4, y: 0.6 },
      });
    });

    expect(screen.getByText('Moving')).toBeInTheDocument();
  });

  it('removes the destination marker when a moving unit becomes idle', async () => {
    mockedStartMove.mockResolvedValue({
      unitId: 'unit-1',
      status: 'moving',
      startAt: '2026-01-01T00:00:00.000Z',
      arrivalAt: '2026-01-01T00:05:00.000Z',
      origin: { hex: { q: 2, r: 3 }, position: { x: 0.35, y: 0.72 } },
      destination: { hex: { q: 2, r: 4 }, position: { x: 0.4, y: 0.6 } },
      distance: 0.739,
    });

    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [
        {
          biome: 'ocean',
          resources: [],
          dangerLevel: 1,
          coordinates: { q: 2, r: 4 },
        },
      ],
      hexResources: null,
      playerId: 'player-1',
      playerName: 'Ada',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetUnits: [mobileUnit],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('select-unit'));
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    fireEvent.click(screen.getByTestId('select-move-destination'));

    await waitFor(() => {
      expect(mockedStartMove).toHaveBeenCalled();
      expect(screen.getByTestId('pending-move-destination')).toBeInTheDocument();
      expect(screen.getByText('Moving')).toBeInTheDocument();
    });

    latestPatchUnit?.({
      unitId: 'unit-1',
      status: 'idle',
      location: {
        cube: { id: 'cube-1' },
        starSystem: { id: 'system-1' },
        planet: {
          id: 'planet-1',
          hex_coords: { q: 2, r: 4 },
          position: { x: 0.4, y: 0.6 },
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByTestId('pending-move-destination')).not.toBeInTheDocument();
    });
  });

  it('shows a move error when the server rejects the order', async () => {
    mockedStartMove.mockRejectedValue(
      new axios.AxiosError(
        'Request failed',
        '422',
        undefined,
        undefined,
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {},
          config: { headers: new axios.AxiosHeaders() },
          data: { statusCode: 422, message: 'Target hex is out of range.' },
        },
      ),
    );

    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [],
      hexResources: null,
      playerId: 'player-1',
      playerName: 'Ada',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetUnits: [mobileUnit],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('select-unit'));
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));
    fireEvent.click(screen.getByTestId('select-move-destination'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Target hex is out of range.');
    });
  });

  it('sends a stop order when Stop is clicked on a moving vehicule', async () => {
    mockedStopUnit.mockResolvedValue({
      unitId: 'unit-1',
      status: 'idle',
    });

    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [],
      hexResources: null,
      playerId: 'player-1',
      playerName: 'Ada',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetUnits: [{ ...mobileUnit, status: 'moving' }],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('select-unit'));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await waitFor(() => {
      expect(mockedStopUnit).toHaveBeenCalledWith('unit-1', { planetId: 'planet-1' });
    });
  });

  it('shows a stop error when the server rejects the order', async () => {
    mockedStopUnit.mockRejectedValue(
      new axios.AxiosError(
        'Request failed',
        '409',
        undefined,
        undefined,
        {
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: { headers: new axios.AxiosHeaders() },
          data: { statusCode: 409, message: 'Unit is not moving.' },
        },
      ),
    );

    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [],
      hexResources: null,
      playerId: 'player-1',
      playerName: 'Ada',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetUnits: [{ ...mobileUnit, status: 'moving' }],
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('select-unit'));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unit is not moving.');
    });
  });
});
