import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
