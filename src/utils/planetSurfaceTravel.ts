import type { HexCoords } from '../types/planet';
import type { Vec2Local } from '../types/player';
import type { MoveSurfacePoint } from '../types/unit';
import { isHexLocalPointInside } from './hexLocalPosition';
import { axialToScreen, DEFAULT_HEX_LAYOUT, hexVerticalStep, type HexLayoutConfig } from './hexLayout';

export function getToroidalSurfaceOffset(
  fromWorld: Vec2Local,
  toWorld: Vec2Local,
  radius: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): Vec2Local {
  const dx = toWorld.x - fromWorld.x;
  const dy = toWorld.y - fromWorld.y;
  const gridWidth = radius * config.hexWidth;
  const gridHeight = (radius + 1) * hexVerticalStep(config.hexHeight);
  let bestX = dx;
  let bestY = dy;
  let bestDistance = Math.hypot(dx, dy);

  for (const xShift of [-gridWidth, 0, gridWidth]) {
    for (const yShift of [-gridHeight, 0, gridHeight]) {
      const shiftedX = dx + xShift;
      const shiftedY = dy + yShift;
      const distance = Math.hypot(shiftedX, shiftedY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestX = shiftedX;
        bestY = shiftedY;
      }
    }
  }

  return { x: bestX, y: bestY };
}

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
  radius?: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): Vec2Local {
  const from = planetSurfaceToWorldPoint(origin.hex, origin.position, config);
  const to = planetSurfaceToWorldPoint(destination.hex, destination.position, config);
  const offset =
    radius != null && radius > 0
      ? getToroidalSurfaceOffset(from, to, radius, config)
      : { x: to.x - from.x, y: to.y - from.y };

  return {
    x: from.x + offset.x * progress,
    y: from.y + offset.y * progress,
  };
}

export function worldPointToClusterScreen(
  worldPoint: Vec2Local,
  focus: HexCoords,
  clusterTopLeft: Vec2Local,
  radius?: number,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
): Vec2Local {
  const focusWorld = axialToScreen(focus.q, focus.r, config);
  const offset =
    radius != null && radius > 0
      ? getToroidalSurfaceOffset(focusWorld, worldPoint, radius, config)
      : { x: worldPoint.x - focusWorld.x, y: worldPoint.y - focusWorld.y };

  return {
    x: clusterTopLeft.x + offset.x,
    y: clusterTopLeft.y + offset.y,
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

function canonicalizeToroidalWorldPoint(
  worldPoint: Vec2Local,
  radius: number,
  config: HexLayoutConfig,
): Vec2Local {
  const gridWidth = radius * config.hexWidth;
  const gridHeight = (radius + 1) * hexVerticalStep(config.hexHeight);
  const mod = (value: number, size: number) => ((value % size) + size) % size;

  return {
    x: mod(worldPoint.x, gridWidth),
    y: mod(worldPoint.y, gridHeight),
  };
}

function normalizePlanetHexCoords(hex: HexCoords, radius: number): HexCoords {
  const width = radius;
  const height = radius + 1;

  return {
    q: ((hex.q % width) + width) % width,
    r: ((hex.r % height) + height) % height,
  };
}

function finalizeSurfacePoint(
  hex: HexCoords,
  position: Vec2Local,
  radius?: number,
): MoveSurfacePoint {
  return {
    hex: radius != null && radius > 0 ? normalizePlanetHexCoords(hex, radius) : hex,
    position,
  };
}

function estimateSurfaceHexGuess(
  point: Vec2Local,
  config: HexLayoutConfig,
  radius?: number,
): { qGuess: number; rGuess: number } {
  const verticalStep = hexVerticalStep(config.hexHeight);
  let rGuess = Math.floor(point.y / verticalStep);

  if (radius != null && radius > 0) {
    rGuess = Math.min(radius, Math.max(0, rGuess));
  } else {
    rGuess = Math.max(0, rGuess);
  }

  let qGuess = Math.round(
    (point.x - (rGuess % 2) * (config.hexWidth / 2)) / config.hexWidth,
  );

  if (radius != null && radius > 0) {
    qGuess = Math.min(radius - 1, Math.max(0, qGuess));
  }

  return { qGuess, rGuess };
}

/** Maps a continuous surface world point to the containing hex and in-hex position. */
export function worldPointToPlanetSurfacePoint(
  worldPoint: Vec2Local,
  config: HexLayoutConfig = DEFAULT_HEX_LAYOUT,
  radius?: number,
): MoveSurfacePoint {
  const point =
    radius != null && radius > 0
      ? canonicalizeToroidalWorldPoint(worldPoint, radius, config)
      : worldPoint;
  const { qGuess, rGuess } = estimateSurfaceHexGuess(point, config, radius);
  const rMin = radius != null && radius > 0 ? 0 : rGuess - 1;
  const rMax = radius != null && radius > 0 ? radius : rGuess + 1;
  const qMin = radius != null && radius > 0 ? 0 : qGuess - 1;
  const qMax = radius != null && radius > 0 ? radius - 1 : qGuess + 1;

  for (let r = Math.max(rMin, rGuess - 1); r <= Math.min(rMax, rGuess + 1); r += 1) {
    for (let q = Math.max(qMin, qGuess - 1); q <= Math.min(qMax, qGuess + 1); q += 1) {
      const position = hexLocalFromWorldOffset(point, { q, r }, config);
      if (isHexLocalPointInside(position)) {
        return finalizeSurfacePoint({ q, r }, position, radius);
      }
    }
  }

  let bestHex: HexCoords = { q: qGuess, r: rGuess };
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let r = Math.max(rMin, rGuess - 1); r <= Math.min(rMax, rGuess + 1); r += 1) {
    for (let q = Math.max(qMin, qGuess - 1); q <= Math.min(qMax, qGuess + 1); q += 1) {
      const distance = distanceToHexCenter(point, { q, r }, config);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestHex = { q, r };
      }
    }
  }

  const position = hexLocalFromWorldOffset(point, bestHex, config);

  return finalizeSurfacePoint(
    bestHex,
    {
      x: Math.min(1, Math.max(0, position.x)),
      y: Math.min(1, Math.max(0, position.y)),
    },
    radius,
  );
}
