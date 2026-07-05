import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HexUnitMarkers } from '@components/game/HexUnitMarkers';
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
};

describe('HexUnitMarkers', () => {
  it('calls onUnitSelect when a selectable unit is clicked', () => {
    const onUnitSelect = vi.fn();

    render(
      <HexUnitMarkers
        units={[unit]}
        playerId="player-1"
        selectable
        onUnitSelect={onUnitSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Scout-X1' }));

    expect(onUnitSelect).toHaveBeenCalledWith(unit);
  });

  it('marks the selected unit with aria-pressed', () => {
    render(
      <HexUnitMarkers
        units={[unit]}
        ownUnitMarker="sprite"
        selectable
        selectedUnitId="unit-1"
        onUnitSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Scout-X1' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('positions the unit marker from planet.position', () => {
    const { container } = render(
      <HexUnitMarkers units={[unit]} playerId="player-1" ownUnitMarker="sprite" />,
    );

    expect(container.querySelector('.hex-grid__unit')).toHaveStyle({
      left: '20%',
      top: '40%',
    });
  });

  it('uses a dot marker for own units on the planet grid', () => {
    const { container } = render(
      <HexUnitMarkers units={[unit]} playerId="player-1" ownUnitMarker="dot" />,
    );

    expect(container.querySelector('.hex-grid__unit--own')).toBeInTheDocument();
    expect(container.querySelector('.hex-grid__unit--sprite')).not.toBeInTheDocument();
  });

  it('uses sprites for own units on the hex page', () => {
    const { container } = render(
      <HexUnitMarkers units={[unit]} playerId="player-1" ownUnitMarker="sprite" />,
    );

    expect(container.querySelector('.hex-grid__unit--sprite')).toBeInTheDocument();
    expect(container.querySelector('.hex-grid__unit--own')).not.toBeInTheDocument();
  });

  it('marks moving vehicules with a moving class', () => {
    const { container } = render(
      <HexUnitMarkers
        units={[{ ...unit, status: 'moving' }]}
        playerId="player-1"
        ownUnitMarker="sprite"
      />,
    );

    expect(container.querySelector('.hex-grid__unit--moving')).toBeInTheDocument();
  });

  it('marks selected moving vehicules with both selected and moving classes', () => {
    const { container } = render(
      <HexUnitMarkers
        units={[{ ...unit, status: 'moving' }]}
        playerId="player-1"
        ownUnitMarker="sprite"
        selectable
        selectedUnitId="unit-1"
        onUnitSelect={vi.fn()}
      />,
    );

    const marker = container.querySelector('.hex-grid__unit');
    expect(marker).toHaveClass('hex-grid__unit--selected');
    expect(marker).toHaveClass('hex-grid__unit--moving');
  });

  it('does not mark moving buildings with a moving class', () => {
    const { container } = render(
      <HexUnitMarkers
        units={[
          {
            ...unit,
            status: 'moving',
            type: { ...unit.type, type: 'building' },
          },
        ]}
        playerId="player-1"
        ownUnitMarker="sprite"
      />,
    );

    expect(container.querySelector('.hex-grid__unit--moving')).not.toBeInTheDocument();
  });

  it('renders a dark blue selection ring for a vehicule under construction', () => {
    const { container } = render(
      <HexUnitMarkers
        units={[{ ...unit, status: 'building' }]}
        playerId="player-1"
        ownUnitMarker="sprite"
      />,
    );

    expect(container.querySelector('.hex-grid__unit--constructing')).toBeInTheDocument();
    expect(container.querySelector('.hex-grid__unit--sprite')).toBeInTheDocument();
  });
});
