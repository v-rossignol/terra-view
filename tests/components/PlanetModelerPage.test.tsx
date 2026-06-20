import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanetModelerPage } from '@components/PlanetModelerPage';

vi.mock('@hooks/usePlanetModeler', () => ({
  usePlanetModeler: vi.fn(),
}));

import { usePlanetModeler } from '@hooks/usePlanetModeler';

const mockedHook = vi.mocked(usePlanetModeler);

const baseState = {
  status: 'idle' as const,
  radius: 10,
  type: 'rocky' as const,
  seed: '',
  preview: null,
  error: null,
  setRadius: vi.fn(),
  setType: vi.fn(),
  setSeed: vi.fn(),
  randomizeSeed: vi.fn(),
  generate: vi.fn(),
};

describe('PlanetModelerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHook.mockReturnValue(baseState);
  });

  it('renders controls and the idle message', () => {
    render(
      <MemoryRouter>
        <PlanetModelerPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Random seed' })).toBeInTheDocument();
    expect(screen.getByText(/Set parameters and click Generate/)).toBeInTheDocument();
  });

  it('calls generate when the button is clicked', () => {
    const generate = vi.fn();
    mockedHook.mockReturnValue({ ...baseState, generate });

    render(
      <MemoryRouter>
        <PlanetModelerPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('shows a Stellar Gate link on unauthorized responses', () => {
    mockedHook.mockReturnValue({
      ...baseState,
      status: 'unauthorized',
      error: 'Sign in to generate planet previews.',
    });

    render(
      <MemoryRouter>
        <PlanetModelerPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Go to Stellar Gate' })).toHaveAttribute(
      'href',
      '/stellar-gate/',
    );
  });

  it('shows an admin-only message on forbidden responses', () => {
    mockedHook.mockReturnValue({
      ...baseState,
      status: 'error',
      error: 'Admin access is required to use the planet modeler.',
    });

    render(
      <MemoryRouter>
        <PlanetModelerPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Admin access');
  });
});
