import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClientHeader } from '@components/ui/ClientHeader';

describe('ClientHeader', () => {
  it('shows player and planet on one line when ready', () => {
    render(
      <ClientHeader status="ready" playerName="pilot42" planetName="Planet 1" />,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.getByRole('banner')).toHaveTextContent('Player');
    expect(screen.getByRole('banner')).toHaveTextContent('pilot42');
    expect(screen.getByRole('banner')).toHaveTextContent('Planet');
    expect(screen.getByRole('banner')).toHaveTextContent('Planet 1');
  });

  it('shows loading state without player context', () => {
    render(<ClientHeader status="loading" />);

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Player')).not.toBeInTheDocument();
  });

  it('shows only the app title on error', () => {
    render(<ClientHeader status="error" playerName="pilot42" planetName="Planet 1" />);

    expect(screen.getByRole('banner')).toHaveTextContent('Terra View');
    expect(screen.queryByText('pilot42')).not.toBeInTheDocument();
    expect(screen.queryByText('Planet 1')).not.toBeInTheDocument();
  });
});
