const unitSpriteModules = import.meta.glob<string>('../assets/units/*.png', {
  eager: true,
  import: 'default',
});

export function getUnitSprite(typeId: string): string | undefined {
  return unitSpriteModules[`../assets/units/${typeId}.png`];
}
