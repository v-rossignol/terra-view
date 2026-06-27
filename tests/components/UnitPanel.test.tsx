import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('button', { name: 'Cargo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract' })).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Speed:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Cargo capacity: 1000')).toBeInTheDocument();
    expect(screen.getByText('Extraction: speed 5, types *')).toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Cargo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extract' })).not.toBeInTheDocument();
  });

  it('shows Cargo without Move for immobile units with cargo', () => {
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

    expect(screen.getByRole('button', { name: 'Cargo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Extract' })).not.toBeInTheDocument();
  });

  it('shows Extract without other action buttons for units with extraction only', () => {
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

    expect(screen.getByRole('button', { name: 'Extract' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargo' })).not.toBeInTheDocument();
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

  it('calls onMoveClick and reflects move mode active state', () => {
    const onMoveClick = vi.fn();

    render(<UnitPanel unit={unit} moveModeActive onMoveClick={onMoveClick} />);

    const moveButton = screen.getByRole('button', { name: 'Move' });
    expect(moveButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(moveButton);
    expect(onMoveClick).toHaveBeenCalledTimes(1);
  });
});
