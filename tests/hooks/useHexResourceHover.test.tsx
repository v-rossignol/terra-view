import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useHexResourceHover } from '@hooks/useHexResourceHover';
import { resourceService } from '@services/resourceService';

vi.mock('@services/resourceService', () => ({
  resourceService: {
    getPlanetHexResources: vi.fn(),
  },
}));

const mockedResources = vi.mocked(resourceService);

describe('useHexResourceHover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches hex resources after the hover delay', async () => {
    mockedResources.getPlanetHexResources.mockResolvedValue({
      planetId: 'planet-1',
      coordinates: { q: 2, r: 1 },
      biome: 'forest',
      resources: [{ type: 'wood', abundance: 50, rarity: 'common' }],
    });

    const { result } = renderHook(() => useHexResourceHover('planet-1', { delayMs: 300 }));

    act(() => {
      result.current.onHexEnter({ q: 2, r: 1 });
    });

    expect(result.current.hoveredHex).toEqual({ q: 2, r: 1 });
    expect(result.current.status).toBe('idle');
    expect(mockedResources.getPlanetHexResources).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('ready');
    expect(mockedResources.getPlanetHexResources).toHaveBeenCalledWith('planet-1', 2, 1);
    expect(result.current.hexResources?.resources).toHaveLength(1);
  });

  it('cancels the fetch when the pointer leaves before the delay', async () => {
    const { result } = renderHook(() => useHexResourceHover('planet-1', { delayMs: 300 }));

    act(() => {
      result.current.onHexEnter({ q: 0, r: 0 });
    });

    act(() => {
      result.current.onHexLeave();
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockedResources.getPlanetHexResources).not.toHaveBeenCalled();
    expect(result.current.hoveredHex).toBeNull();
  });

  it('clears hover state when the planet changes', async () => {
    mockedResources.getPlanetHexResources.mockResolvedValue({
      planetId: 'planet-1',
      coordinates: { q: 1, r: 0 },
      biome: 'plain',
      resources: [],
    });

    const { result, rerender } = renderHook(
      ({ planetId }: { planetId: string | null }) => useHexResourceHover(planetId),
      { initialProps: { planetId: 'planet-1' as string | null } },
    );

    act(() => {
      result.current.onHexEnter({ q: 1, r: 0 });
    });

    rerender({ planetId: 'planet-2' });

    expect(result.current.hoveredHex).toBeNull();
    expect(result.current.hexResources).toBeNull();
  });
});
