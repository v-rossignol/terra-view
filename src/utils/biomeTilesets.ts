import type { BiomeType } from '../types/planet';
import plain from '../assets/tilesets/plain.png';
import desert from '../assets/tilesets/desert.png';
import forest from '../assets/tilesets/forest.png';
import ice from '../assets/tilesets/ice.png';
import mountain from '../assets/tilesets/mountain.png';
import ocean from '../assets/tilesets/ocean.png';
import volcanic from '../assets/tilesets/volcanic.png';

const BIOME_TILESETS: Record<BiomeType, string> = {
  desert,
  forest,
  ocean,
  mountain,
  ice,
  volcanic,
  plain,
};

export function getBiomeTileset(biome: BiomeType): string {
  return BIOME_TILESETS[biome];
}
