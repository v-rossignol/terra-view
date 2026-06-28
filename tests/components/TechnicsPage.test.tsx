import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TechnicsPage } from '@components/TechnicsPage';

describe('TechnicsPage', () => {
  it('shows the unauthorized technic and an Enter Stellar Gate button', () => {
    render(
      <MemoryRouter initialEntries={['/technics?code=unauthorized']}>
        <Routes>
          <Route path="/technics" element={<TechnicsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.getByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('not signed in');
    expect(screen.getByRole('button', { name: 'Enter Stellar Gate' })).toBeInTheDocument();
  });

  it('navigates to Stellar Gate when Enter Stellar Gate is clicked', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign },
    });

    render(
      <MemoryRouter initialEntries={['/technics?code=unauthorized']}>
        <Routes>
          <Route path="/technics" element={<TechnicsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter Stellar Gate' }));

    expect(assign).toHaveBeenCalledWith('/stellar-gate/');
  });

  it('falls back to the unknown technic when code is missing', () => {
    render(
      <MemoryRouter initialEntries={['/technics']}>
        <Routes>
          <Route path="/technics" element={<TechnicsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Terra View' })).toHaveAttribute('href', '/');
  });
});
