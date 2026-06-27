import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MoveDestinationMarker } from '@components/game/MoveDestinationMarker';

describe('MoveDestinationMarker', () => {
  it('renders a marker at the given normalized position', () => {
    const { container } = render(<MoveDestinationMarker position={{ x: 0.25, y: 0.75 }} />);

    const marker = container.querySelector('.hex-grid__move-marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveStyle({ left: '25%', top: '75%' });
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });
});
