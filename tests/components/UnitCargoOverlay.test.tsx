import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitCargoOverlay } from '@components/ui/UnitCargoOverlay';
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
  cargo: { wood: 50, 'iron-ore': 10 },
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
      cargo: { size: 1000 },
    },
    description: null,
    metadata: {},
  },
};

describe('UnitCargoOverlay', () => {
  it('renders nothing when unit is null', () => {
    const { container } = render(<UnitCargoOverlay unit={null} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders cargo entries with resource names and gauge', () => {
    render(<UnitCargoOverlay unit={unit} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Scout X1 cargo' })).toBeInTheDocument();
    expect(screen.getByText('Scout X1')).toBeInTheDocument();
    expect(screen.getByText('60 / 1000')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Cargo space used' })).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
    expect(screen.getByText('Wood')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Iron ore')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();

    render(<UnitCargoOverlay unit={unit} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();

    render(<UnitCargoOverlay unit={unit} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog', { name: 'Scout X1 cargo' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the panel', () => {
    const onClose = vi.fn();

    render(<UnitCargoOverlay unit={unit} onClose={onClose} />);

    fireEvent.click(screen.getByText('Wood'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();

    render(<UnitCargoOverlay unit={unit} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDrop when a drop button is clicked', () => {
    const onDrop = vi.fn();

    render(<UnitCargoOverlay unit={unit} onClose={vi.fn()} onDrop={onDrop} />);

    fireEvent.click(screen.getByRole('button', { name: 'Drop Wood' }));
    expect(onDrop).toHaveBeenCalledWith({ id: 'wood', quantity: 50 });
  });
});
