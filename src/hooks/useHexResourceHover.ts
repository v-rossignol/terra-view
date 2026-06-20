import { useCallback, useEffect, useRef, useState } from 'react';
import { resourceService } from '../services/resourceService';
import type { HexCoords } from '../types/planet';
import type { PlanetHexResources } from '../types/resource';
import { getErrorMessage } from '../utils/helpers';

export type HexResourceHoverStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface HexResourceHoverState {
  hoveredHex: HexCoords | null;
  hexResources: PlanetHexResources | null;
  status: HexResourceHoverStatus;
  error: string | null;
  onHexEnter: (coords: HexCoords) => void;
  onHexLeave: () => void;
}

const DEFAULT_HOVER_DELAY_MS = 400;

export function useHexResourceHover(
  planetId: string | null,
  options?: { delayMs?: number },
): HexResourceHoverState {
  const delayMs = options?.delayMs ?? DEFAULT_HOVER_DELAY_MS;
  const [hoveredHex, setHoveredHex] = useState<HexCoords | null>(null);
  const [hexResources, setHexResources] = useState<PlanetHexResources | null>(null);
  const [status, setStatus] = useState<HexResourceHoverStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const requestIdRef = useRef(0);

  const clearHoverTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const resetHoverState = useCallback(() => {
    clearHoverTimer();
    requestIdRef.current += 1;
    setHoveredHex(null);
    setHexResources(null);
    setStatus('idle');
    setError(null);
  }, [clearHoverTimer]);

  const onHexLeave = useCallback(() => {
    resetHoverState();
  }, [resetHoverState]);

  const onHexEnter = useCallback(
    (coords: HexCoords) => {
      clearHoverTimer();
      const hoverSession = ++requestIdRef.current;
      setHoveredHex(coords);
      setHexResources(null);
      setStatus('idle');
      setError(null);

      if (planetId == null) {
        return;
      }

      timerRef.current = setTimeout(() => {
        if (hoverSession !== requestIdRef.current) {
          return;
        }

        setStatus('loading');

        void resourceService
          .getPlanetHexResources(planetId, coords.q, coords.r)
          .then((data) => {
            if (hoverSession !== requestIdRef.current) {
              return;
            }
            setHexResources(data);
            setStatus('ready');
          })
          .catch((err: unknown) => {
            if (hoverSession !== requestIdRef.current) {
              return;
            }
            setStatus('error');
            setError(getErrorMessage(err, 'Failed to load hex resources.'));
          });
      }, delayMs);
    },
    [clearHoverTimer, delayMs, planetId],
  );

  useEffect(() => {
    resetHoverState();
  }, [planetId, resetHoverState]);

  useEffect(() => {
    return () => {
      clearHoverTimer();
      requestIdRef.current += 1;
    };
  }, [clearHoverTimer]);

  return {
    hoveredHex,
    hexResources,
    status,
    error,
    onHexEnter,
    onHexLeave,
  };
}
