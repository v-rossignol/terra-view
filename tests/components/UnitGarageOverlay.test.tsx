import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitGarageOverlay } from '@components/ui/UnitGarageOverlay';
import type { UnitInstance } from '../../src/types/unit';

const garage: UnitInstance = {
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
  garage: {
    'scout-parked': { id: 'scout-parked', typeId: 'scout-x1' },
  },
  type: {
    id: 'sawmill',
    name: 'Sawmill',
    type: 'building',
    size: 'small',
    mobility: false,
    speed: null,
    environments: ['forest'],
    rules: [],
    capabilities: {
      garage: { small: 1, medium: 0, large: 0 },
    },
    description: null,
    metadata: {},
  },
};

const parkedVehicle: UnitInstance = {
  id: 'scout-parked',
  typeId: 'scout-x1',
  ownerId: 'player-1',
  location: garage.location,
  status: 'inactive',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  metadata: {
    parking: {
      garageUnitId: 'sawmill-1',
      parkedAt: '2026-01-01T00:00:00.000Z',
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
    rules: [],
    capabilities: {},
    description: null,
    metadata: {},
  },
};

describe('UnitGarageOverlay', () => {
  it('renders nothing when unit is null', () => {
    const { container } = render(
      <UnitGarageOverlay unit={null} planetUnits={[]} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lists parked vehicles and slot usage', () => {
    render(
      <UnitGarageOverlay unit={garage} planetUnits={[garage, parkedVehicle]} onClose={vi.fn()} />,
    );

    expect(screen.getByLabelText('Sawmill garage')).toBeInTheDocument();
    expect(screen.getByText('Slots: 1/1 small')).toBeInTheDocument();
    expect(screen.getByText('Scout-X1')).toBeInTheDocument();
    expect(screen.getByText('Small')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();

    render(
      <UnitGarageOverlay unit={garage} planetUnits={[garage, parkedVehicle]} onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows unpark buttons and calls onUnpark with the vehicle id', () => {
    const onUnpark = vi.fn();

    render(
      <UnitGarageOverlay
        unit={garage}
        planetUnits={[garage, parkedVehicle]}
        onClose={vi.fn()}
        onUnpark={onUnpark}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Unpark Scout-X1' }));

    expect(onUnpark).toHaveBeenCalledWith('scout-parked');
  });

  it('opens the transfer panel when transfer is clicked', () => {
    render(
      <UnitGarageOverlay unit={garage} planetUnits={[garage, parkedVehicle]} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Scout-X1' }));

    expect(screen.getByLabelText('Scout-X1 transfer')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sawmill garage')).not.toBeInTheDocument();
  });

  it('returns to the garage panel from transfer via back', () => {
    render(
      <UnitGarageOverlay unit={garage} planetUnits={[garage, parkedVehicle]} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Scout-X1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByLabelText('Sawmill garage')).toBeInTheDocument();
    expect(screen.queryByLabelText('Scout-X1 transfer')).not.toBeInTheDocument();
  });

  it('returns to the garage panel from transfer on Escape', () => {
    const onClose = vi.fn();

    render(
      <UnitGarageOverlay
        unit={garage}
        planetUnits={[garage, parkedVehicle]}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Scout-X1' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByLabelText('Sawmill garage')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onTransferCargo from the transfer footer', () => {
    const garageWithCargo: UnitInstance = {
      ...garage,
      cargo: { wood: 5 },
      type: {
        ...garage.type,
        capabilities: {
          garage: { small: 1, medium: 0, large: 0 },
          cargo: { size: 10 },
        },
      },
    };
    const onTransferCargo = vi.fn();

    render(
      <UnitGarageOverlay
        unit={garageWithCargo}
        planetUnits={[garageWithCargo, parkedVehicle]}
        onClose={vi.fn()}
        onTransferCargo={onTransferCargo}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Scout-X1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wood' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(onTransferCargo).toHaveBeenCalledWith({
      sourceUnitId: 'sawmill-1',
      targetUnitId: 'scout-parked',
      resource: { id: 'wood', quantity: 5 },
    });
  });
});
