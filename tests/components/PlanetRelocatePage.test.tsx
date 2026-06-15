import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanetRelocatePage } from '@components/PlanetRelocatePage';

vi.mock('@hooks/usePlanetRelocate', () => ({
  usePlanetRelocate: vi.fn(),
}));

import { usePlanetRelocate } from '@hooks/usePlanetRelocate';

const mockedHook = vi.mocked(usePlanetRelocate);

describe('PlanetRelocatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while relocating', () => {
    mockedHook.mockReturnValue({ status: 'loading', error: null });

    render(
      <MemoryRouter initialEntries={['/planet-1']}>
        <Routes>
          <Route path="/:planetId" element={<PlanetRelocatePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Relocating…')).toBeInTheDocument();
  });

  it('shows the error and a back link when relocation fails', () => {
    mockedHook.mockReturnValue({
      status: 'error',
      error: 'You are not allowed to travel to this planet.',
    });

    render(
      <MemoryRouter initialEntries={['/planet-1']}>
        <Routes>
          <Route path="/:planetId" element={<PlanetRelocatePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('not allowed');
    expect(screen.getByRole('link', { name: 'Back to Terra View' })).toHaveAttribute('href', '/');
  });
});
