import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildingPanel } from '@components/ui/BuildingPanel';
import type { UnitInstance } from '../../src/types/unit';

vi.mock('@services/unitService', () => ({
  unitService: {
    listBuildableUnitTypes: vi.fn(),
  },
}));

import { unitService } from '@services/unitService';

const mockedListBuildableUnitTypes = vi.mocked(unitService.listBuildableUnitTypes);

const unit: UnitInstance = {
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
    name: 'Scout X1',
    type: 'vehicule',
    size: 'small',
    mobility: true,
    speed: 2,
    environments: ['forest'],
    rules: [],
    capabilities: {
      building: {
        speed: 1,
        buildings: { sizes: ['small'], units: ['*'] },
      },
    },
    description: null,
    metadata: {},
  },
};

const sawmill = {
  id: 'sawmill',
  name: 'Sawmill',
  type: 'building' as const,
  size: 'small' as const,
  mobility: false,
  speed: null,
  environments: ['forest'],
  rules: [],
  capabilities: {},
  description: null,
  metadata: {},
  buildDurationMs: 100_000,
};

describe('BuildingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when unit is null', () => {
    const { container } = render(
      <BuildingPanel unit={null} planetId="planet-1" hexCoords={{ q: 2, r: 3 }} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('loads buildable units from the server and passes them to the panel', async () => {
    mockedListBuildableUnitTypes.mockResolvedValue([sawmill]);

    render(
      <BuildingPanel unit={unit} planetId="planet-1" hexCoords={{ q: 2, r: 3 }} onClose={vi.fn()} />,
    );

    expect(screen.getByText('Loading buildable units…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sawmill')).toBeInTheDocument();
    });

    expect(mockedListBuildableUnitTypes).toHaveBeenCalledWith('unit-1', {
      planetId: 'planet-1',
      q: 2,
      r: 3,
    });
    expect(screen.getByText('Scout X1 - Building')).toBeInTheDocument();
  });

  it('shows an empty state when no buildable units are returned', async () => {
    mockedListBuildableUnitTypes.mockResolvedValue([]);

    render(
      <BuildingPanel unit={unit} planetId="planet-1" hexCoords={{ q: 2, r: 3 }} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText('No buildable units on this hex.')).toBeInTheDocument();
    });
  });

  it('shows a load error when the request fails', async () => {
    mockedListBuildableUnitTypes.mockRejectedValue(new Error('Network error'));

    render(
      <BuildingPanel unit={unit} planetId="planet-1" hexCoords={{ q: 2, r: 3 }} onClose={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('calls onClose when the close button is clicked', async () => {
    mockedListBuildableUnitTypes.mockResolvedValue([]);
    const onClose = vi.fn();

    render(
      <BuildingPanel unit={unit} planetId="planet-1" hexCoords={{ q: 2, r: 3 }} onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    mockedListBuildableUnitTypes.mockResolvedValue([]);
    const onClose = vi.fn();

    render(
      <BuildingPanel unit={unit} planetId="planet-1" hexCoords={{ q: 2, r: 3 }} onClose={onClose} />,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('passes onBuild and isBuildable to the buildable units panel', async () => {
    mockedListBuildableUnitTypes.mockResolvedValue([sawmill]);
    const onBuild = vi.fn();
    const isBuildable = vi.fn(() => true);

    render(
      <BuildingPanel
        unit={unit}
        planetId="planet-1"
        hexCoords={{ q: 2, r: 3 }}
        onClose={vi.fn()}
        onBuild={onBuild}
        isBuildable={isBuildable}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Build Sawmill' })).toBeInTheDocument();
    });

    expect(isBuildable).toHaveBeenCalledWith(sawmill);

    fireEvent.click(screen.getByRole('button', { name: 'Build Sawmill' }));

    expect(onBuild).toHaveBeenCalledWith(sawmill);
  });
});
