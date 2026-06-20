import type { AdminGeneratedPlanetPreview, GeneratePlanetParams } from '../types/admin';
import { api } from './api';

export const adminService = {
  async generatePlanetPreview(
    params: GeneratePlanetParams = {},
  ): Promise<AdminGeneratedPlanetPreview> {
    const response = await api.get<AdminGeneratedPlanetPreview>('/admin/planets/generate', {
      params,
    });
    return response.data;
  },
};
