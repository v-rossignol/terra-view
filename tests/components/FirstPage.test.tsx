import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirstPage } from '@components/FirstPage';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@hooks/useFirstPageBootstrap', () => ({
  useFirstPageBootstrap: vi.fn(),
}));

vi.mock('@components/game/HexGrid', () => ({
  HexGrid: ({
    onHexClick,
  }: {
    onHexClick?: (coords: { q: number; r: number }) => void;
  }) => (
    <button type="button" onClick={() => onHexClick?.({ q: 2, r: 3 })}>
      Open hex
    </button>
  ),
}));

import { useFirstPageBootstrap } from '@hooks/useFirstPageBootstrap';

const mockedHook = vi.mocked(useFirstPageBootstrap);

describe('FirstPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to the hex page when a hex is clicked', () => {
    mockedHook.mockReturnValue({
      status: 'ready',
      playerName: 'Ada',
      playerId: 'player-1',
      starName: 'Sol',
      starSystemHref: '/solaris/system-1',
      planetName: 'Astra Prime',
      planet: {
        _id: 'planet-1',
        name: 'Astra Prime',
        starSystemId: 'system-1',
        type: 'rocky',
        radius: 10,
        surface: { hexagons: [], generatedAt: '2026-01-01T00:00:00.000Z' },
      },
      playerHex: { q: 0, r: 0 },
      planetUnits: [],
      error: null,
    });

    render(
      <MemoryRouter>
        <FirstPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open hex' }));

    expect(navigate).toHaveBeenCalledWith('/planet-1/2/3');
  });
});
