import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanetHexPage } from '@components/PlanetHexPage';

vi.mock('@hooks/usePlanetHex', () => ({
  usePlanetHex: vi.fn(),
}));

vi.mock('@components/game/SingleHexView', () => ({
  SingleHexView: () => <div data-testid="single-hex-view" />,
}));

import { usePlanetHex } from '@hooks/usePlanetHex';

const mockedHook = vi.mocked(usePlanetHex);

describe('PlanetHexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while fetching the hex', () => {
    mockedHook.mockReturnValue({
      status: 'loading',
      planetName: null,
      planetRadius: null,
      coords: null,
      hex: null,
      neighbors: [],
      hexResources: null,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading hex…')).toBeInTheDocument();
  });

  it('shows the hex and resource panel when ready', () => {
    mockedHook.mockReturnValue({
      status: 'ready',
      planetName: 'Astra Prime',
      planetRadius: 10,
      coords: { q: 2, r: 3 },
      hex: {
        biome: 'forest',
        resources: [],
        dangerLevel: 4,
        coordinates: { q: 2, r: 3 },
      },
      neighbors: [
        {
          biome: 'ocean',
          resources: [],
          dangerLevel: 1,
          coordinates: { q: 2, r: 4 },
        },
      ],
      hexResources: {
        planetId: 'planet-1',
        coordinates: { q: 2, r: 3 },
        biome: 'forest',
        resources: [],
      },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Astra Prime · Hex (2, 3)')).toBeInTheDocument();
    expect(screen.getByTestId('single-hex-view')).toBeInTheDocument();
    expect(screen.getByText('Danger level: 4')).toBeInTheDocument();
    expect(screen.getByText('No resources on this hex.')).toBeInTheDocument();
  });

  it('shows an error and back link when loading fails', () => {
    mockedHook.mockReturnValue({
      status: 'error',
      planetName: null,
      planetRadius: null,
      coords: { q: 2, r: 3 },
      hex: null,
      neighbors: [],
      hexResources: null,
      error: 'Hex (2, 3) is outside this planet\'s surface.',
    });

    render(
      <MemoryRouter initialEntries={['/planet-1/2/3']}>
        <Routes>
          <Route path="/:planetId/:q/:r" element={<PlanetHexPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('outside this planet');
    expect(screen.getByRole('link', { name: 'Back to planet surface' })).toHaveAttribute('href', '/');
  });
});
