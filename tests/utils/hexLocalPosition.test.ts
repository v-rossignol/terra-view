import { describe, expect, it } from 'vitest';
import {
  clientPointToHexLocalPosition,
  hexLocalPositionToPercent,
} from '@utils/hexLocalPosition';

function mockCellElement(rect: DOMRect): HTMLElement {
  return {
    getBoundingClientRect: () => rect,
  } as HTMLElement;
}

describe('hexLocalPosition', () => {
  it('maps the cell center to normalized coordinates', () => {
    const cell = mockCellElement(new DOMRect(100, 200, 200, 160));

    expect(clientPointToHexLocalPosition(cell, 200, 280)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('returns null for clicks outside the hex polygon', () => {
    const cell = mockCellElement(new DOMRect(0, 0, 100, 100));

    expect(clientPointToHexLocalPosition(cell, 5, 5)).toBeNull();
    expect(clientPointToHexLocalPosition(cell, 95, 5)).toBeNull();
  });

  it('accepts clicks inside the hex polygon near the center', () => {
    const cell = mockCellElement(new DOMRect(0, 0, 100, 100));

    const position = clientPointToHexLocalPosition(cell, 50, 50);

    expect(position).not.toBeNull();
    expect(position?.x).toBeCloseTo(0.5);
    expect(position?.y).toBeCloseTo(0.5);
  });

  it('converts local position to percentage CSS values', () => {
    expect(hexLocalPositionToPercent({ x: 0.25, y: 0.75 })).toEqual({
      left: '25%',
      top: '75%',
    });
  });
});
