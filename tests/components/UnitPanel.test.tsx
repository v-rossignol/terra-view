import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitPanel } from '@components/ui/UnitPanel';
import type { UnitInstance } from '../../src/types/unit';

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
      extraction: { speed: 5, types: ['*'] },
      cargo: { size: 1000 },
      building: {
        speed: 1,
        buildings: { sizes: ['small'], units: ['*'] },
      },
    },
    description: null,
    metadata: {},
  },
};

describe('UnitPanel', () => {
  it('renders nothing when no unit is selected', () => {
    const { container } = render(<UnitPanel unit={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the unit name when a unit is selected', () => {
    render(<UnitPanel unit={unit} />);

    expect(screen.getByRole('complementary', { name: 'Unit panel' })).toBeInTheDocument();
    expect(screen.getByText('Scout X1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View cargo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extraction: speed 5, types *' })).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Speed:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Cargo space used' })).toBeInTheDocument();
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Building: speed 1; buildings sizes small, units *' })).toBeInTheDocument();
    const extractionButton = screen.getByRole('button', { name: 'Extraction: speed 5, types *' });
    expect(extractionButton).toBeInTheDocument();
    expect(extractionButton).toHaveAttribute('title', 'Extraction: speed 5, types *');
    expect(extractionButton.querySelector('img')).toBeInTheDocument();
    expect(screen.queryByText('Extraction: speed 5, types *')).not.toBeInTheDocument();
    expect(screen.queryByText('Building: speed 1; buildings sizes small, units *')).not.toBeInTheDocument();
  });

  it('shows building icon to the left of extraction with move aligned last', () => {
    render(<UnitPanel unit={unit} />);

    const capabilityRow = screen.getByRole('listitem');
    const labels = within(capabilityRow)
      .getAllByRole('button')
      .map((element) => element.getAttribute('aria-label'));

    expect(labels).toEqual([
      'Building: speed 1; buildings sizes small, units *',
      'Extraction: speed 5, types *',
      'Move',
    ]);
  });

  it('shows stationary speed and no capabilities for immobile units', () => {
    render(
      <UnitPanel
        unit={{
          ...unit,
          type: {
            ...unit.type,
            mobility: false,
            speed: null,
            capabilities: {},
          },
        }}
      />,
    );

    expect(screen.getByText('Stationary')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View cargo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extraction: speed 5, types *' })).not.toBeInTheDocument();
  });

  it('shows view cargo without Move for immobile units with cargo', () => {
    render(
      <UnitPanel
        unit={{
          ...unit,
          type: {
            ...unit.type,
            mobility: false,
            speed: null,
            capabilities: {
              cargo: { size: 500 },
            },
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'View cargo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extraction: speed 3, types iron' })).not.toBeInTheDocument();
  });

  it('shows building icon without extraction when only building is present', () => {
    render(
      <UnitPanel
        unit={{
          ...unit,
          type: {
            ...unit.type,
            mobility: false,
            speed: null,
            capabilities: {
              building: {
                speed: 2,
                vehicules: { sizes: ['small'], units: ['scout-x1'] },
              },
            },
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Building: speed 2; vehicules sizes small, units scout-x1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extraction: speed 5, types *' })).not.toBeInTheDocument();
  });

  it('shows extraction icon without other action buttons for units with extraction only', () => {
    render(
      <UnitPanel
        unit={{
          ...unit,
          type: {
            ...unit.type,
            mobility: false,
            speed: null,
            capabilities: {
              extraction: { speed: 3, types: ['iron'] },
            },
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Extraction: speed 3, types iron' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View cargo' })).not.toBeInTheDocument();
  });

  it('shows moving status in green', () => {
    render(<UnitPanel unit={{ ...unit, status: 'moving' }} />);

    expect(screen.getByText('Moving')).toHaveStyle({ color: 'rgb(107, 207, 127)' });
  });

  it('shows a Stop button when a vehicule is moving', () => {
    const onStopClick = vi.fn();

    render(<UnitPanel unit={{ ...unit, status: 'moving' }} onStopClick={onStopClick} />);

    const stopButton = screen.getByRole('button', { name: 'Stop' });
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(onStopClick).toHaveBeenCalledTimes(1);
  });

  it('does not show a Stop button for idle vehicules', () => {
    render(<UnitPanel unit={{ ...unit, status: 'idle' }} onStopClick={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
  });

  it('does not show a Stop button for moving buildings', () => {
    render(
      <UnitPanel
        unit={{
          ...unit,
          status: 'moving',
          type: { ...unit.type, type: 'building' },
        }}
        onStopClick={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
  });

  it('shows a Stop button when a unit is extracting', () => {
    const onStopClick = vi.fn();

    render(<UnitPanel unit={{ ...unit, status: 'extracting' }} onStopClick={onStopClick} />);

    const stopButton = screen.getByRole('button', { name: 'Stop' });
    expect(screen.getByText('Extracting')).toBeInTheDocument();
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(onStopClick).toHaveBeenCalledTimes(1);
  });

  it('shows extracting status in green', () => {
    render(<UnitPanel unit={{ ...unit, status: 'extracting' }} />);

    expect(screen.getByText('Extracting')).toHaveStyle({ color: 'rgb(107, 207, 127)' });
  });

  it('calls onMoveClick and reflects move mode active state', () => {
    const onMoveClick = vi.fn();

    render(<UnitPanel unit={unit} moveModeActive onMoveClick={onMoveClick} />);

    const moveButton = screen.getByRole('button', { name: 'Move' });
    expect(moveButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(moveButton);
    expect(onMoveClick).toHaveBeenCalledTimes(1);
  });

  it('shows cargo gauge with used space from unit cargo', () => {
    render(
      <UnitPanel
        unit={{
          ...unit,
          cargo: { 'iron-ore': 120, water: 30 },
        }}
      />,
    );

    expect(screen.getByText('150 / 1000')).toBeInTheDocument();
  });

  it('calls onCargoClick and reflects cargo panel open state', () => {
    const onCargoClick = vi.fn();

    render(<UnitPanel unit={unit} cargoPanelOpen onCargoClick={onCargoClick} />);

    const viewCargoButton = screen.getByRole('button', { name: 'View cargo' });
    expect(viewCargoButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(viewCargoButton);
    expect(onCargoClick).toHaveBeenCalledTimes(1);
  });

  it('calls onBuildingClick and reflects building panel open state', () => {
    const onBuildingClick = vi.fn();

    render(<UnitPanel unit={unit} buildingPanelOpen onBuildingClick={onBuildingClick} />);

    const buildingButton = screen.getByRole('button', { name: 'Building: speed 1; buildings sizes small, units *' });
    expect(buildingButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(buildingButton);
    expect(onBuildingClick).toHaveBeenCalledTimes(1);
  });

  it('calls onExtractClick and reflects extract panel open state', () => {
    const onExtractClick = vi.fn();

    render(<UnitPanel unit={unit} extractPanelOpen onExtractClick={onExtractClick} />);

    const extractionButton = screen.getByRole('button', { name: 'Extraction: speed 5, types *' });
    expect(extractionButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(extractionButton);
    expect(onExtractClick).toHaveBeenCalledTimes(1);
  });
});
