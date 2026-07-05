import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitExtractionOverlay } from '@components/ui/UnitExtractionOverlay';
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
      extraction: { speed: 5, types: ['*'] },
    },
    description: null,
    metadata: {},
  },
};

describe('UnitExtractionOverlay', () => {
  it('renders nothing when unit is null', () => {
    const { container } = render(
      <UnitExtractionOverlay unit={null} biome="forest" onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when biome is null', () => {
    const { container } = render(
      <UnitExtractionOverlay unit={unit} biome={null} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lists extractable forest biome resources with yield per tick', () => {
    render(<UnitExtractionOverlay unit={unit} biome="forest" onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Extraction' })).toBeInTheDocument();
    expect(screen.getByText('Scout X1 - Extraction')).toBeInTheDocument();
    expect(screen.getByText('forest')).toBeInTheDocument();
    expect(screen.getByText('Wood')).toBeInTheDocument();
    expect(screen.getByText('250 / t.')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('25 / t.')).toBeInTheDocument();
  });

  it('filters resources by unit extraction types', () => {
    render(
      <UnitExtractionOverlay
        unit={{
          ...unit,
          type: {
            ...unit.type,
            capabilities: {
              extraction: { speed: 3, types: ['wood'] },
            },
          },
        }}
        biome="forest"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Wood')).toBeInTheDocument();
    expect(screen.queryByText('Food')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();

    render(<UnitExtractionOverlay unit={unit} biome="forest" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onStartExtract when Go is clicked', () => {
    const onStartExtract = vi.fn();

    render(
      <UnitExtractionOverlay
        unit={unit}
        biome="forest"
        onClose={vi.fn()}
        onStartExtract={onStartExtract}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Extract Wood' }));
    expect(onStartExtract).toHaveBeenCalledWith('wood');
  });

  it('disables Go buttons while a resource is pending', () => {
    render(
      <UnitExtractionOverlay
        unit={unit}
        biome="forest"
        pendingResourceId="wood"
        onClose={vi.fn()}
        onStartExtract={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Extract Wood' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Extract Food' })).toBeDisabled();
  });

  it('shows extract errors', () => {
    render(
      <UnitExtractionOverlay
        unit={unit}
        biome="forest"
        extractError="Unit cargo is already full"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Unit cargo is already full');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();

    render(<UnitExtractionOverlay unit={unit} biome="forest" onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
