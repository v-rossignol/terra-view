import { describe, expect, it } from 'vitest';
import { getUnitSprite } from '../../src/utils/unitSprites';

describe('unitSprites', () => {
  it('returns a bundled sprite URL when the asset exists', () => {
    expect(getUnitSprite('scout-x1')).toBeTruthy();
  });

  it('returns undefined when no sprite asset exists for the type id', () => {
    expect(getUnitSprite('unknown-unit')).toBeUndefined();
  });
});
