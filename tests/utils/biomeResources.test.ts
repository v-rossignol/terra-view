import { describe, expect, it } from 'vitest';
import {
  getExtractableBiomeResources,
  getExtractableBiomeResourcesForBiomes,
  getPermanentBiomeResources,
} from '../../src/utils/biomeResources';

describe('biomeResources', () => {
  it('returns permanent resources for a biome', () => {
    const resources = getPermanentBiomeResources('forest');

    expect(resources).toEqual([
      { id: 'wood', name: 'Wood', quantity: 50 },
      { id: 'food', name: 'Food', quantity: 5 },
    ]);
  });

  it('returns all biome resources when extraction types include wildcard', () => {
    const resources = getExtractableBiomeResources('forest', ['*']);

    expect(resources.map((resource) => resource.id)).toEqual(['wood', 'food']);
  });

  it('filters biome resources by extraction types', () => {
    const resources = getExtractableBiomeResources('forest', ['wood']);

    expect(resources).toEqual([{ id: 'wood', name: 'Wood', quantity: 50 }]);
  });

  it('merges resources across biomes and keeps the highest quantity per id', () => {
    const resources = getExtractableBiomeResourcesForBiomes(['forest', 'ocean'], [
      'food',
      'salt-water',
    ]);

    expect(resources).toEqual([
      { id: 'food', name: 'Food', quantity: 30 },
      { id: 'salt-water', name: 'Salt water', quantity: 100 },
    ]);
  });
});
