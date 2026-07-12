import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SingleHexView } from '@components/game/SingleHexView';
import type { PlanetHexagon } from '../../src/types/planet';
import type { UnitInstance } from '../../src/types/unit';

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

const sawmillOnFocusHex: UnitInstance = {
  id: 'sawmill-1',
  typeId: 'sawmill',
  ownerId: 'player-1',
  location: {
    cube: { id: 'cube-1' },
    starSystem: { id: 'system-1' },
    planet: {
      id: 'planet-1',
      hex_coords: { q: 2, r: 3 },
      position: { x: 0.5, y: 0.5 },
    },
  },
  status: 'idle',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {},
  cargo: {},
  garage: {},
  type: {
    id: 'sawmill',
    name: 'Sawmill',
    type: 'building',
    size: 'small',
    mobility: false,
    speed: null,
    environments: ['forest'],
    rules: [],
    capabilities: {},
    description: null,
    metadata: {},
  },
};

const sawmillOnNeighborHex: UnitInstance = {
  ...sawmillOnFocusHex,
  id: 'sawmill-neighbor',
  location: {
    cube: { id: 'cube-1' },
    starSystem: { id: 'system-1' },
    planet: {
      id: 'planet-1',
      hex_coords: { q: 2, r: 4 },
      position: { x: 0.5, y: 0.5 },
    },
  },
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

    const focusCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="3"]') as HTMLElement;
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

  it('does not select a move destination on a building footprint', () => {
    const onMoveDestinationSelect = vi.fn();

    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        planetUnits={[sawmillOnFocusHex]}
        moveModeActive
        validMoveHexes={[{ q: 2, r: 3 }]}
        onMoveDestinationSelect={onMoveDestinationSelect}
      />,
    );

    const focusCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="3"]') as HTMLElement;
    Object.defineProperty(focusCell, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(100, 100, 200, 160),
    });

    fireEvent.click(focusCell, { clientX: 200, clientY: 180 });

    expect(onMoveDestinationSelect).not.toHaveBeenCalled();
  });

  it('selects a move destination outside a building footprint on the same hex', () => {
    const onMoveDestinationSelect = vi.fn();

    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        planetUnits={[sawmillOnFocusHex]}
        moveModeActive
        validMoveHexes={[{ q: 2, r: 3 }]}
        onMoveDestinationSelect={onMoveDestinationSelect}
      />,
    );

    const focusCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="3"]') as HTMLElement;
    Object.defineProperty(focusCell, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(100, 100, 200, 160),
    });

    fireEvent.click(focusCell, { clientX: 150, clientY: 180 });

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

    const neighborCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="4"]') as HTMLElement;
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

  it('adds move mode class to the viewport without highlighting valid cells', () => {
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
    expect(container.querySelectorAll('.hex-grid__cell--move-target')).toHaveLength(0);
  });

  it('calls onBuildTargetSelect when clicking the focus hex in build mode', () => {
    const onBuildTargetSelect = vi.fn();

    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        buildModeActive
        buildFootprintCells={1}
        onBuildTargetSelect={onBuildTargetSelect}
      />,
    );

    const focusCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="3"]') as HTMLElement;
    const overlay = focusCell.querySelector('.hex-grid__build-overlay') as HTMLElement;
    Object.defineProperty(overlay, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(100, 100, 200, 160),
    });

    fireEvent.click(overlay, { clientX: 200, clientY: 180 });

    expect(onBuildTargetSelect).toHaveBeenCalledWith('central-1-1');
  });

  it('renders a garage area circle on the focus hex when preview is set', () => {
    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        garageAreaPreview={{
          center: { x: 0.5, y: 0.5 },
          radiusHex: 0.16,
        }}
      />,
    );

    const garageArea = container.querySelector('.hex-grid__garage-area');
    expect(garageArea).toBeInTheDocument();
    const focusCell = garageArea?.closest('.hex-grid__cell');
    expect(focusCell).toHaveAttribute('data-q', '2');
    expect(focusCell).toHaveAttribute('data-r', '3');
  });

  it('adds build mode classes to the viewport and focus cell', () => {
    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        buildModeActive
        buildFootprintCells={2}
      />,
    );

    expect(container.querySelector('.hex-grid-viewport--build-mode')).toBeInTheDocument();
    expect(container.querySelector('.hex-grid__cell--build-target')).toBeInTheDocument();
    expect(container.querySelector('.hex-grid__build-overlay')).toBeInTheDocument();
  });

  it('renders a construction site overlay on the target hex', () => {
    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        playerId="player-1"
        planetUnits={[
          {
            id: 'builder-1',
            typeId: 'scout-x1',
            ownerId: 'player-1',
            location: {
              cube: { id: 'cube-1' },
              starSystem: { id: 'system-1' },
              planet: {
                id: 'planet-1',
                hex_coords: { q: 2, r: 4 },
                position: { x: 0.2, y: 0.2 },
              },
            },
            status: 'building',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            metadata: {
              building: {
                targetTypeId: 'sawmill',
                planetId: 'planet-1',
                hexCoords: { q: 2, r: 3 },
                buildingZoneId: 'central-1-1',
                startedAt: '2026-01-01T00:00:00.000Z',
                completedAt: '2026-01-01T00:01:40.000Z',
              },
            },
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
          },
        ]}
      />,
    );

    const focusCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="3"]');
    expect(focusCell?.querySelector('.hex-grid__construction-footprint')).toBeInTheDocument();
    expect(focusCell?.querySelector('.hex-grid__construction-label')).toHaveTextContent('Sawmill');
    expect(focusCell?.querySelector('.hex-grid__construction-progress')).toHaveTextContent(/\d+%/);
  });

  it('calls onNeighborUnitSelect when clicking a unit on a neighbor hex', () => {
    const onNeighborUnitSelect = vi.fn();

    const { container } = render(
      <SingleHexView
        hex={focusHex}
        radius={10}
        neighbors={[neighborHex]}
        planetUnits={[sawmillOnNeighborHex]}
        onUnitSelect={vi.fn()}
        onNeighborUnitSelect={onNeighborUnitSelect}
      />,
    );

    const neighborCell = container.querySelector('.hex-grid__cell[data-q="2"][data-r="4"]');
    const unitButton = neighborCell?.querySelector('.hex-grid__unit--selectable');

    expect(unitButton).toBeInTheDocument();
    fireEvent.click(unitButton!);

    expect(onNeighborUnitSelect).toHaveBeenCalledWith({ q: 2, r: 4 }, sawmillOnNeighborHex);
  });
});
