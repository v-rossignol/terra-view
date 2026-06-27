import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SingleHexView } from '@components/game/SingleHexView';
import type { PlanetHexagon } from '../../src/types/planet';

vi.mock('@hooks/useContainerSize', () => ({
  useContainerSize: () => ({
    ref: { current: null },
    size: { width: 800, height: 600 },
  }),
}));

const focusHex: PlanetHexagon = {
  biome: 'forest',
  resources: [],
  dangerLevel: 1,
  coordinates: { q: 2, r: 3 },
};

const neighborHex: PlanetHexagon = {
  biome: 'ocean',
  resources: [],
  dangerLevel: 1,
  coordinates: { q: 2, r: 4 },
};

describe('SingleHexView move mode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onMoveDestinationSelect when clicking a valid hex in move mode', () => {
    const onMoveDestinationSelect = vi.fn();

    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        moveModeActive
        validMoveHexes={[
          { q: 2, r: 3 },
          { q: 2, r: 4 },
        ]}
        onMoveDestinationSelect={onMoveDestinationSelect}
      />,
    );

    const focusCell = container.querySelector('[data-q="2"][data-r="3"]') as HTMLElement;
    Object.defineProperty(focusCell, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(100, 100, 200, 160),
    });

    fireEvent.click(focusCell, { clientX: 200, clientY: 180 });

    expect(onMoveDestinationSelect).toHaveBeenCalledWith(
      { q: 2, r: 3 },
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    );
  });

  it('does not navigate neighbors while move mode is active', () => {
    const onNeighborClick = vi.fn();

    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        moveModeActive
        validMoveHexes={[
          { q: 2, r: 3 },
          { q: 2, r: 4 },
        ]}
        onNeighborClick={onNeighborClick}
      />,
    );

    const neighborCell = container.querySelector('[data-q="2"][data-r="4"]') as HTMLElement;
    Object.defineProperty(neighborCell, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(300, 100, 200, 160),
    });

    fireEvent.click(neighborCell, { clientX: 400, clientY: 180 });

    expect(onNeighborClick).not.toHaveBeenCalled();
  });

  it('renders a move destination marker on the matching hex', () => {
    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        pendingMoveDestination={{
          hex_coords: { q: 2, r: 4 },
          position: { x: 0.5, y: 0.5 },
        }}
      />,
    );

    expect(container.querySelector('.hex-grid__move-marker')).toBeInTheDocument();
  });

  it('adds move mode classes to the viewport and valid cells', () => {
    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        moveModeActive
        validMoveHexes={[{ q: 2, r: 3 }]}
      />,
    );

    expect(container.querySelector('.hex-grid-viewport--move-mode')).toBeInTheDocument();
    expect(container.querySelectorAll('.hex-grid__cell--move-target')).toHaveLength(1);
  });
});
