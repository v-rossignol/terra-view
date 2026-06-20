import { renderHook, act, waitFor } from '@testing-library/react';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanetModeler } from '@hooks/usePlanetModeler';
import { adminService } from '@services/adminService';

vi.mock('@services/adminService', () => ({
  adminService: {
    generatePlanetPreview: vi.fn(),
  },
}));

const mockedAdmin = vi.mocked(adminService);

const preview = {
  _id: 'seed-123',
  name: 'Preview Planet' as const,
  type: 'rocky' as const,
  radius: 10,
  surface: {
    hexagons: [
      {
        biome: 'forest' as const,
        resources: [],
        dangerLevel: 0,
        coordinates: { q: 0, r: 0 },
      },
    ],
    generatedAt: '2026-06-20T12:00:00.000Z',
  },
};

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

describe('usePlanetModeler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a preview and updates the seed on success', async () => {
    mockedAdmin.generatePlanetPreview.mockResolvedValueOnce(preview);

    const { result } = renderHook(() => usePlanetModeler());

    await act(async () => {
      await result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(mockedAdmin.generatePlanetPreview).toHaveBeenCalledWith({
      radius: 10,
      type: 'rocky',
    });
    expect(result.current.preview).toEqual(preview);
    expect(result.current.seed).toBe('seed-123');
  });

  it('passes a trimmed seed when provided', async () => {
    mockedAdmin.generatePlanetPreview.mockResolvedValueOnce(preview);

    const { result } = renderHook(() => usePlanetModeler());

    act(() => {
      result.current.setSeed('  custom-seed  ');
    });

    await act(async () => {
      await result.current.generate();
    });

    expect(mockedAdmin.generatePlanetPreview).toHaveBeenCalledWith({
      radius: 10,
      type: 'rocky',
      seed: 'custom-seed',
    });
  });

  it('shows an unauthorized state on 401', async () => {
    mockedAdmin.generatePlanetPreview.mockRejectedValueOnce(createAxiosError(401, 'Unauthorized'));

    const { result } = renderHook(() => usePlanetModeler());

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.status).toBe('unauthorized');
    expect(result.current.error).toContain('Sign in');
  });

  it('generates a new seed and clears the previous preview', async () => {
    mockedAdmin.generatePlanetPreview.mockResolvedValueOnce(preview);

    const { result } = renderHook(() => usePlanetModeler());

    await act(async () => {
      await result.current.generate();
    });

    const previousSeed = result.current.seed;
    expect(result.current.preview).not.toBeNull();

    act(() => {
      result.current.randomizeSeed();
    });

    expect(result.current.seed).not.toBe(previousSeed);
    expect(result.current.seed.length).toBeGreaterThan(0);
    expect(result.current.preview).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('shows a forbidden message on 403', async () => {
    mockedAdmin.generatePlanetPreview.mockRejectedValueOnce(createAxiosError(403, 'Forbidden'));

    const { result } = renderHook(() => usePlanetModeler());

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('Admin access');
  });
});
