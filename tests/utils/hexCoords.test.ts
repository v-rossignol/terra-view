import { describe, expect, it } from 'vitest';
import { formatHexCoords, isHexInBounds, parseHexCoord } from '@utils/hexCoords';

describe('hexCoords', () => {
  describe('parseHexCoord', () => {
    it('parses non-negative integers', () => {
      expect(parseHexCoord('0')).toBe(0);
      expect(parseHexCoord('12')).toBe(12);
    });

    it('rejects invalid values', () => {
      expect(parseHexCoord(undefined)).toBeNull();
      expect(parseHexCoord('')).toBeNull();
      expect(parseHexCoord('-1')).toBeNull();
      expect(parseHexCoord('1.5')).toBeNull();
      expect(parseHexCoord('abc')).toBeNull();
    });
  });

  describe('isHexInBounds', () => {
    it('accepts coordinates inside a radius 10 grid', () => {
      expect(isHexInBounds(0, 0, 10)).toBe(true);
      expect(isHexInBounds(9, 10, 10)).toBe(true);
    });

    it('rejects coordinates outside the grid', () => {
      expect(isHexInBounds(10, 0, 10)).toBe(false);
      expect(isHexInBounds(0, 11, 10)).toBe(false);
      expect(isHexInBounds(-1, 0, 10)).toBe(false);
    });
  });

  describe('formatHexCoords', () => {
    it('formats axial coordinates', () => {
      expect(formatHexCoords({ q: 3, r: 7 })).toBe('(3, 7)');
    });
  });
});
