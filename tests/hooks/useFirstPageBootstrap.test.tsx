import { renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirstPageBootstrap } from '@hooks/useFirstPageBootstrap';
import { authService } from '@services/authService';
import { playerService } from '@services/playerService';
import { planetService } from '@services/planetService';
import { starSystemService } from '@services/starSystemService';
import { unitService } from '@services/unitService';

vi.mock('@services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@services/playerService', () => ({
  playerService: {
    enterGame: vi.fn(),
    canEnterStarSystem: vi.fn(),
    updatePlanetHex: vi.fn(),
  },
}));

vi.mock('@services/planetService', () => ({
  planetService: {
    getPlanet: vi.fn(),
  },
}));

vi.mock('@services/starSystemService', () => ({
  starSystemService: {
    getStarSystem: vi.fn(),
  },
}));

vi.mock('@services/unitService', () => ({
  unitService: {
    listPlanetUnits: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);
const mockedPlayer = vi.mocked(playerService);
const mockedPlanet = vi.mocked(planetService);
const mockedStarSystem = vi.mocked(starSystemService);
const mockedUnits = vi.mocked(unitService);

const planetLocation = {
  cube: { id: 'cube-1' },
  starSystem: { id: 'system-1' },
  planet: { id: 'planet-1', hex_coords: { q: 1, r: 2 } },
};

const createAxiosError = (status: number): AxiosError => {
  const error = new AxiosError('Request failed', String(status));
  error.response = {
    data: { message: 'Unauthorized' },
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new axios.AxiosHeaders() } as InternalAxiosRequestConfig,
  };
  return error;
};

describe('useFirstPageBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUnits.listPlanetUnits.mockResolvedValue([]);
  });

  it('loads player and planet names when session is valid', async () => {
    mockedAuth.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      username: 'pilot42',
      email: 'pilot@example.com',
    });
    mockedPlayer.enterGame.mockResolvedValue({
      player: {
        id: 'player-1',
        userId: 'user-1',
        location: planetLocation,
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:05:00.000Z',
      },
    });
    mockedPlanet.getPlanet.mockResolvedValue({
      _id: 'planet-1',
      name: 'Planet 1',
      starSystemId: 'system-1',
      type: 'rocky',
      radius: 5,
    });
    mockedStarSystem.getStarSystem.mockResolvedValue({
      _id: 'system-1',
      name: 'Alpha Centauri',
    });
    mockedPlayer.canEnterStarSystem.mockResolvedValue({ canEnter: true });

    const { result } = renderHook(() => useFirstPageBootstrap());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.playerName).toBe('pilot42');
    expect(result.current.playerId).toBe('player-1');
    expect(result.current.starName).toBe('Alpha Centauri');
    expect(result.current.starSystemHref).toBe('/solaris/system-1');
    expect(result.current.planetName).toBe('Planet 1');
    expect(result.current.planet).toEqual({
      _id: 'planet-1',
      name: 'Planet 1',
      starSystemId: 'system-1',
      type: 'rocky',
      radius: 5,
    });
    expect(result.current.playerHex).toEqual({ q: 1, r: 2 });
    expect(result.current.planetUnits).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockedStarSystem.getStarSystem).toHaveBeenCalledWith('system-1');
    expect(mockedUnits.listPlanetUnits).toHaveBeenCalledWith('planet-1');
    expect(mockedPlayer.canEnterStarSystem).toHaveBeenCalledWith('system-1');
    expect(mockedPlayer.updatePlanetHex).not.toHaveBeenCalled();
  });

  it('selects a spawn hex when the player is at planet overview', async () => {
    mockedAuth.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      username: 'pilot42',
      email: 'pilot@example.com',
    });
    mockedPlayer.enterGame.mockResolvedValue({
      player: {
        id: 'player-1',
        userId: 'user-1',
        location: {
          cube: { id: 'cube-1' },
          starSystem: { id: 'system-1' },
          planet: { id: 'planet-1' },
        },
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:05:00.000Z',
      },
    });
    mockedPlanet.getPlanet.mockResolvedValue({
      _id: 'planet-1',
      name: 'Planet 1',
      starSystemId: 'system-1',
      type: 'rocky',
      radius: 5,
    });
    mockedPlayer.updatePlanetHex.mockResolvedValue({
      player: {
        id: 'player-1',
        userId: 'user-1',
        location: {
          cube: { id: 'cube-1' },
          starSystem: { id: 'system-1' },
          planet: { id: 'planet-1', hex_coords: { q: 3, r: 4 } },
        },
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:06:00.000Z',
      },
    });
    mockedStarSystem.getStarSystem.mockResolvedValue({
      _id: 'system-1',
      name: 'Alpha Centauri',
    });
    mockedPlayer.canEnterStarSystem.mockResolvedValue({ canEnter: true });

    const { result } = renderHook(() => useFirstPageBootstrap());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(mockedPlayer.updatePlanetHex).toHaveBeenCalledOnce();
    expect(result.current.playerHex).toEqual({ q: 3, r: 4 });
  });

  it('omits the Solaris link when the player cannot enter the star system', async () => {
    mockedAuth.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      username: 'pilot42',
      email: 'pilot@example.com',
    });
    mockedPlayer.enterGame.mockResolvedValue({
      player: {
        id: 'player-1',
        userId: 'user-1',
        location: planetLocation,
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:05:00.000Z',
      },
    });
    mockedPlanet.getPlanet.mockResolvedValue({
      _id: 'planet-1',
      name: 'Planet 1',
      starSystemId: 'system-1',
      type: 'rocky',
      radius: 5,
    });
    mockedStarSystem.getStarSystem.mockResolvedValue({
      _id: 'system-1',
      name: 'Alpha Centauri',
    });
    mockedPlayer.canEnterStarSystem.mockResolvedValue({ canEnter: false });

    const { result } = renderHook(() => useFirstPageBootstrap());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current.starName).toBe('Alpha Centauri');
    expect(result.current.starSystemHref).toBeNull();
  });

  it('returns an auth error when the session is missing', async () => {
    mockedAuth.getCurrentUser.mockRejectedValue(createAxiosError(401));

    const { result } = renderHook(() => useFirstPageBootstrap());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.playerName).toBeNull();
    expect(result.current.planetName).toBeNull();
    expect(result.current.error).toContain('not signed in');
    expect(result.current.error).toContain('/stellar-gate/');
  });

  it('returns an error when the player is not on a planet', async () => {
    mockedAuth.getCurrentUser.mockResolvedValue({
      id: 'user-1',
      username: 'pilot42',
      email: 'pilot@example.com',
    });
    mockedPlayer.enterGame.mockResolvedValue({
      player: {
        id: 'player-1',
        userId: 'user-1',
        location: { cube: { id: 'cube-1', position: { x: 0, y: 0, z: 0 } } },
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:05:00.000Z',
      },
    });

    const { result } = renderHook(() => useFirstPageBootstrap());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.playerName).toBe('pilot42');
    expect(result.current.planetName).toBeNull();
    expect(result.current.error).toContain('not on a planet surface');
    expect(mockedPlanet.getPlanet).not.toHaveBeenCalled();
  });
});
