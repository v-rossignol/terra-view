import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ClientHeader } from '@components/ui/ClientHeader';

describe('ClientHeader', () => {
  it('shows player, star, and planet on one line when ready', () => {
    render(
      <ClientHeader
        status="ready"
        playerName="pilot42"
        starName="Alpha Centauri"
        starSystemHref="/solaris/system-1"
        planetName="Planet 1"
      />,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.getByRole('banner')).toHaveTextContent('Player');
    expect(screen.getByRole('banner')).toHaveTextContent('pilot42');
    expect(screen.getByRole('banner')).toHaveTextContent('Star');
    expect(screen.getByRole('banner')).toHaveTextContent('Alpha Centauri');
    expect(screen.getByRole('banner')).toHaveTextContent('Planet');
    expect(screen.getByRole('banner')).toHaveTextContent('Planet 1');
    expect(screen.getByRole('link', { name: 'Alpha Centauri' })).toHaveAttribute(
      'href',
      '/solaris/system-1',
    );
  });

  it('shows star name as plain text when Solaris navigation is not allowed', () => {
    render(
      <ClientHeader
        status="ready"
        playerName="pilot42"
        starName="Alpha Centauri"
        planetName="Planet 1"
      />,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Alpha Centauri');
    expect(screen.queryByRole('link', { name: 'Alpha Centauri' })).not.toBeInTheDocument();
  });

  it('shows loading state without player context', () => {
    render(<ClientHeader status="loading" />);

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Player')).not.toBeInTheDocument();
  });

  it('shows only the app title on error', () => {
    render(
      <ClientHeader
        status="error"
        playerName="pilot42"
        starName="Alpha Centauri"
        planetName="Planet 1"
      />,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.queryByText('pilot42')).not.toBeInTheDocument();
    expect(screen.queryByText('Alpha Centauri')).not.toBeInTheDocument();
    expect(screen.queryByText('Planet 1')).not.toBeInTheDocument();
  });

  it('shows an optional detail segment after the planet name', () => {
    render(
      <ClientHeader
        status="ready"
        playerName="pilot42"
        planetName="Planet 1"
        detail="Hex (2, 3)"
      />,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Hex (2, 3)');
  });

  it('links the planet name when planetTo is provided', () => {
    render(
      <MemoryRouter>
        <ClientHeader
          status="ready"
          playerName="pilot42"
          planetName="Planet 1"
          planetTo="/"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Planet 1' })).toHaveAttribute('href', '/');
  });

  it('shows a reload button that refreshes the page', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload },
    });

    render(<ClientHeader status="loading" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('toggles zoom level when the zoom button is clicked', () => {
    const onZoomClick = vi.fn();

    render(
      <ClientHeader status="ready" zoomLevel={1} onZoomClick={onZoomClick} />,
    );

    const zoomButton = screen.getByRole('button', { name: 'Zoom level 1' });
    expect(zoomButton).toHaveTextContent('1');

    fireEvent.click(zoomButton);

    expect(onZoomClick).toHaveBeenCalledTimes(1);
  });
});
