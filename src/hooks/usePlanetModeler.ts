import { useCallback, useState } from 'react';
import axios from 'axios';
import { adminService } from '../services/adminService';
import type { AdminGeneratedPlanetPreview, PlanetType } from '../types/admin';
import { getErrorMessage } from '../utils/helpers';
import { createRandomSeed } from '../utils/randomSeed';

export type ModelerStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unauthorized';

export interface PlanetModelerState {
  status: ModelerStatus;
  radius: number;
  type: PlanetType;
  seed: string;
  preview: AdminGeneratedPlanetPreview | null;
  error: string | null;
  setRadius: (radius: number) => void;
  setType: (type: PlanetType) => void;
  setSeed: (seed: string) => void;
  randomizeSeed: () => void;
  generate: () => Promise<void>;
}

const DEFAULT_RADIUS = 10;
const DEFAULT_TYPE: PlanetType = 'rocky';

export const usePlanetModeler = (): PlanetModelerState => {
  const [status, setStatus] = useState<ModelerStatus>('idle');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [type, setType] = useState<PlanetType>(DEFAULT_TYPE);
  const [seed, setSeed] = useState('');
  const [preview, setPreview] = useState<AdminGeneratedPlanetPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const randomizeSeed = useCallback(() => {
    setSeed(createRandomSeed());
    setPreview(null);
    setError(null);
    setStatus('idle');
  }, []);

  const generate = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const params = {
        radius,
        type,
        ...(seed.trim() ? { seed: seed.trim() } : {}),
      };
      const result = await adminService.generatePlanetPreview(params);
      setPreview(result);
      setSeed(result._id);
      setStatus('ready');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setStatus('unauthorized');
        setError('Sign in to generate planet previews.');
        return;
      }

      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setStatus('error');
        setError('Admin access is required to use the planet modeler.');
        return;
      }

      setStatus('error');
      setError(getErrorMessage(err, 'Failed to generate planet preview.'));
    }
  }, [radius, seed, type]);

  return {
    status,
    radius,
    type,
    seed,
    preview,
    error,
    setRadius,
    setType,
    setSeed,
    randomizeSeed,
    generate,
  };
};
