import { renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { usePlanetRelocate } from '@hooks/usePlanetRelocate';
import { playerService } from '@services/playerService';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@services/playerService', () => ({
  playerService: {
    relocateToPlanet: vi.fn(),
  },
}));

const mockedPlayer = vi.mocked(playerService);

const createAxiosError = (status: number, message: string): AxiosError => {
  const error = new AxiosError('Request failed', String(status));
  error.response = {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new axios.AxiosHeaders() } as InternalAxiosRequestConfig,
  };
  return error;
};

const wrapper =
  () =>
  ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('usePlanetRelocate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the landing page after a successful relocate', async () => {
    mockedPlayer.relocateToPlanet.mockResolvedValue({
      player: {
        id: 'player-1',
        userId: 'user-1',
        location: {
          cube: { id: 'cube-1' },
          starSystem: { id: 'system-1' },
          planet: { id: 'planet-1', hex_coords: { q: 0, r: 0 } },
        },
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:05:00.000Z',
      },
    });

    const { result } = renderHook(() => usePlanetRelocate('planet-1'), { wrapper: wrapper() });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(mockedPlayer.relocateToPlanet).toHaveBeenCalledWith('planet-1');
    expect(result.current.status).toBe('loading');
  });

  it('returns an error when relocation fails', async () => {
    mockedPlayer.relocateToPlanet.mockRejectedValue(createAxiosError(404, 'Planet missing'));

    const { result } = renderHook(() => usePlanetRelocate('missing-planet'), {
      wrapper: wrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe('Planet missing');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('returns an error when the planet id is missing', async () => {
    const { result } = renderHook(() => usePlanetRelocate('   '), { wrapper: wrapper() });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe('Missing planet id.');
    expect(mockedPlayer.relocateToPlanet).not.toHaveBeenCalled();
  });
});
