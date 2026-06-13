import { renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirstPageBootstrap } from '@hooks/useFirstPageBootstrap';
import { authService } from '@services/authService';
import { playerService } from '@services/playerService';
import { planetService } from '@services/planetService';

vi.mock('@services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@services/playerService', () => ({
  playerService: {
    enterGame: vi.fn(),
  },
}));

vi.mock('@services/planetService', () => ({
  planetService: {
    getPlanet: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);
const mockedPlayer = vi.mocked(playerService);
const mockedPlanet = vi.mocked(planetService);

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

    const { result } = renderHook(() => useFirstPageBootstrap());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current).toEqual({
      status: 'ready',
      playerName: 'pilot42',
      planetName: 'Planet 1',
      error: null,
    });
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
