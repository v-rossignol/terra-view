import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanetUnitsWithSocket } from '@hooks/usePlanetSocket';
import { planetSocketService } from '@services/planetSocketService';
import type { UnitInstance } from '../../src/types/unit';
import { SOCKET_EVENTS } from '../../src/types/socket';
import { SOCKET_IO_PATH } from '../../src/utils/socketUrl';

const { mockEmit, mockOn, mockOnce, mockSocket, mockIo } = vi.hoisted(
  () => {
    const mockEmit = vi.fn();
    const mockOn = vi.fn();
    const mockOff = vi.fn();
    const mockOnce = vi.fn();
    const mockDisconnect = vi.fn();

    const mockSocket = {
      connected: false,
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
      once: mockOnce,
      disconnect: mockDisconnect,
    };

    const mockIo = vi.fn(() => mockSocket);

    return { mockEmit, mockOn, mockOnce, mockSocket, mockIo };
  },
);

vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

const baseUnit = (overrides: Partial<UnitInstance> = {}): UnitInstance => ({
  id: 'unit-1',
  typeId: 'scout-x1',
  ownerId: 'player-1',
  location: {
    cube: { id: 'cube-1' },
    starSystem: { id: 'system-1' },
    planet: {
      id: 'planet-1',
      hex_coords: { q: 2, r: 3 },
      position: { x: 0.2, y: 0.4 },
    },
  },
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {},
  cargo: {},
  garage: {},
  type: {
    id: 'scout-x1',
    name: 'Scout-X1',
    type: 'vehicule',
    size: 'small',
    mobility: true,
    speed: 1,
    environments: ['forest'],
    rules: [{ range: 'hexagon', value: 1 }],
    capabilities: {},
    description: null,
    metadata: {},
  },
  ...overrides,
});

describe('usePlanetUnitsWithSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    planetSocketService.disconnect();
    mockSocket.connected = false;

    mockOnce.mockImplementation((event: string, handler: () => void) => {
      if (event === 'connect') {
        mockSocket.connected = true;
        handler();
      }
    });
  });

  afterEach(() => {
    planetSocketService.disconnect();
    vi.restoreAllMocks();
  });

  it('joins the planet room and logs emit/receive debug messages', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    renderHook(() => usePlanetUnitsWithSocket('planet-1', []));

    await waitFor(() => {
      expect(mockIo).toHaveBeenCalledWith(window.location.origin, {
        path: SOCKET_IO_PATH,
        transports: ['websocket'],
        withCredentials: true,
      });
    });

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('PLANET_JOIN', { planetId: 'planet-1' });
    });

    expect(debugSpy).toHaveBeenCalledWith('[PlanetSocketService] emit', {
      event: SOCKET_EVENTS.PLANET_JOIN,
      payload: { planetId: 'planet-1' },
    });

    expect(mockOn).toHaveBeenCalledWith(SOCKET_EVENTS.UNIT_UPDATE, expect.any(Function));

    const unitUpdateHandler = mockOn.mock.calls.find(
      ([event]) => event === SOCKET_EVENTS.UNIT_UPDATE,
    )?.[1] as (payload: unknown) => void;

    const payload = {
      unitId: 'unit-1',
      status: 'idle',
      location: {
        cube: { id: 'cube-1' },
        starSystem: { id: 'system-1' },
        planet: { id: 'planet-1', hex_coords: { q: 2, r: 3 } },
      },
    };

    unitUpdateHandler(payload);

    expect(debugSpy).toHaveBeenCalledWith('[PlanetSocketService] received', {
      event: SOCKET_EVENTS.UNIT_UPDATE,
      payload,
    });
  });

  it('updates unit state when a UNIT_UPDATE event is received', async () => {
    const sourceUnits = [baseUnit()];
    const { result } = renderHook(() => usePlanetUnitsWithSocket('planet-1', sourceUnits));

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('PLANET_JOIN', { planetId: 'planet-1' });
    });

    const unitUpdateHandler = mockOn.mock.calls.find(
      ([event]) => event === SOCKET_EVENTS.UNIT_UPDATE,
    )?.[1] as (payload: unknown) => void;

    const updatedLocation = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: {
        id: 'planet-1',
        hex_coords: { q: 5, r: 6 },
        position: { x: 0.7, y: 0.3 },
      },
    };

    act(() => {
      unitUpdateHandler({
        unitId: 'unit-1',
        status: 'idle',
        location: updatedLocation,
      });
    });

    expect(result.current.units[0]).toMatchObject({
      id: 'unit-1',
      status: 'idle',
      location: updatedLocation,
    });
  });

  it('does not overwrite socket updates when sourceUnits gets a new array reference', async () => {
    const sourceUnits = [baseUnit()];
    const { result, rerender } = renderHook(
      ({ units }) => usePlanetUnitsWithSocket('planet-1', units),
      { initialProps: { units: sourceUnits } },
    );

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('PLANET_JOIN', { planetId: 'planet-1' });
    });

    const unitUpdateHandler = mockOn.mock.calls.find(
      ([event]) => event === SOCKET_EVENTS.UNIT_UPDATE,
    )?.[1] as (payload: unknown) => void;

    const updatedLocation = {
      cube: { id: 'cube-1' },
      starSystem: { id: 'system-1' },
      planet: {
        id: 'planet-1',
        hex_coords: { q: 5, r: 6 },
        position: { x: 0.7, y: 0.3 },
      },
    };

    act(() => {
      unitUpdateHandler({
        unitId: 'unit-1',
        status: 'idle',
        location: updatedLocation,
      });
    });

    rerender({ units: [...sourceUnits] });

    expect(result.current.units[0]).toMatchObject({
      id: 'unit-1',
      status: 'idle',
      location: updatedLocation,
    });
  });

  it('applies local patches through patchUnit', async () => {
    const sourceUnits = [baseUnit({ status: 'idle' })];
    const { result } = renderHook(() => usePlanetUnitsWithSocket('planet-1', sourceUnits));

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('PLANET_JOIN', { planetId: 'planet-1' });
    });

    act(() => {
      result.current.patchUnit({
        unitId: 'unit-1',
        status: 'moving',
        location: sourceUnits[0].location,
      });
    });

    expect(result.current.units[0].status).toBe('moving');
  });

  it('leaves the planet room on unmount', async () => {
    const { unmount } = renderHook(() => usePlanetUnitsWithSocket('planet-1', []));

    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith('PLANET_JOIN', { planetId: 'planet-1' });
    });

    unmount();

    expect(mockEmit).toHaveBeenCalledWith('PLANET_LEAVE', { planetId: 'planet-1' });
  });

  it('does nothing when planetId is missing', () => {
    renderHook(() => usePlanetUnitsWithSocket(null, []));

    expect(mockIo).not.toHaveBeenCalled();
  });
});
