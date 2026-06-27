import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import type { MoveSurfacePoint } from '../types/unit';
import { isHexLocalPointInside } from './hexLocalPosition';
import { axialToScreen, DEFAULT_HEX_LAYOUT, hexVerticalStep, type HexLayoutConfig } from './hexLayout';

export function planetSurfaceToWorldPoint(
  hex: HexCoords,
  position: Vec2Local,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): Vec2Local {
  const origin = axialToScreen(hex.q, hex.r, config);
  return {
    x: origin.x + position.x * config.hexWidth,
    y: origin.y + position.y * config.hexHeight,
  };
}

export function computeMovementProgress(
  startAt: string,
  arrivalAt: string,
  nowMs: number,
): number {
  const startMs = Date.parse(startAt);
  const arrivalMs = Date.parse(arrivalAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(arrivalMs) || arrivalMs <= startMs) {
    return 1;
  }

  return Math.min(1, Math.max(0, (nowMs - startMs) / (arrivalMs - startMs)));
}

export function computeMovementWorldPosition(
  origin: MoveSurfacePoint,
  destination: MoveSurfacePoint,
  progress: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): Vec2Local {
  const from = planetSurfaceToWorldPoint(origin.hex, origin.position, config);
  const to = planetSurfaceToWorldPoint(destination.hex, destination.position, config);

  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

export function worldPointToClusterScreen(
  worldPoint: Vec2Local,
  focus: HexCoords,
  clusterTopLeft: Vec2Local,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): Vec2Local {
  const focusWorld = axialToScreen(focus.q, focus.r, config);

  return {
    x: clusterTopLeft.x + (worldPoint.x - focusWorld.x),
    y: clusterTopLeft.y + (worldPoint.y - focusWorld.y),
  };
}

function hexLocalFromWorldOffset(
  worldPoint: Vec2Local,
  hex: HexCoords,
  config: HexLayoutConfig,
): Vec2Local {
  const origin = axialToScreen(hex.q, hex.r, config);

  return {
    x: (worldPoint.x - origin.x) / config.hexWidth,
    y: (worldPoint.y - origin.y) / config.hexHeight,
  };
}

function distanceToHexCenter(
  worldPoint: Vec2Local,
  hex: HexCoords,
  config: HexLayoutConfig,
): number {
  const origin = axialToScreen(hex.q, hex.r, config);
  const centerX = origin.x + config.hexWidth / 2;
  const centerY = origin.y + config.hexHeight / 2;

  return Math.hypot(worldPoint.x - centerX, worldPoint.y - centerY);
}

/** Maps a continuous surface world point to the containing hex and in-hex position. */
export function worldPointToPlanetSurfacePoint(
  worldPoint: Vec2Local,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): MoveSurfacePoint {
  const verticalStep = hexVerticalStep(config.hexHeight);
  const rGuess = Math.round(worldPoint.y / verticalStep);
  const qGuess = Math.round(
    (worldPoint.x - (rGuess % 2) * (config.hexWidth / 2)) / config.hexWidth,
  );

  for (let r = rGuess - 1; r <= rGuess + 1; r += 1) {
    for (let q = qGuess - 1; q <= qGuess + 1; q += 1) {
      const position = hexLocalFromWorldOffset(worldPoint, { q, r }, config);
      if (isHexLocalPointInside(position)) {
        return { hex: { q, r }, position };
      }
    }
  }

  let bestHex: HexCoords = { q: qGuess, r: rGuess };
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let r = rGuess - 1; r <= rGuess + 1; r += 1) {
    for (let q = qGuess - 1; q <= qGuess + 1; q += 1) {
      const distance = distanceToHexCenter(worldPoint, { q, r }, config);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestHex = { q, r };
      }
    }
  }

  const position = hexLocalFromWorldOffset(worldPoint, bestHex, config);

  return {
    hex: bestHex,
    position: {
      x: Math.min(1, Math.max(0, position.x)),
      y: Math.min(1, Math.max(0, position.y)),
    },
  };
}
