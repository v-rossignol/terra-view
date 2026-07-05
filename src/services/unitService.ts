import type {
  BuildableUnitType,
  DropCargoOrderResult,
  DropCargoRequest,
  ExtractOrderResult,
  ExtractUnitRequest,
  ListBuildableUnitsQuery,
  MoveOrderResult,
  MoveUnitRequest,
  StopExtractionOrderResult,
  StopOrderResult,
  StopUnitRequest,
  UnitInstance,
  BuildUnitRequest,
  BuildOrderResult,
  ParkUnitRequest,
  ParkOrderResult,
  UnparkOrderResult,
  StopBuildOrderResult,
  TransferCargoRequest,
  TransferCargoOrderResult,
} from '../types/unit';
import { api, dedupedGet } from './api';

export const unitService = {
  listPlanetUnits(planetId: string): Promise<UnitInstance[]> {
    return dedupedGet<UnitInstance[]>(`/planets/${encodeURIComponent(planetId)}/units`);
  },

  async startMove(unitId: string, request: MoveUnitRequest): Promise<MoveOrderResult> {
    const response = await api.post<MoveOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/move`,
      request,
    );
    return response.data;
  },

  async stopUnit(unitId: string, request: StopUnitRequest): Promise<StopOrderResult> {
    const response = await api.post<StopOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/stop`,
      request,
    );
    return response.data;
  },

  async startExtract(unitId: string, request: ExtractUnitRequest): Promise<ExtractOrderResult> {
    const response = await api.post<ExtractOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/extract`,
      request,
    );
    return response.data;
  },

  async stopExtraction(unitId: string, request: StopUnitRequest): Promise<StopExtractionOrderResult> {
    const response = await api.post<StopExtractionOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/stop-extraction`,
      request,
    );
    return response.data;
  },

  async dropCargo(unitId: string, request: DropCargoRequest): Promise<DropCargoOrderResult> {
    const response = await api.post<DropCargoOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/drop`,
      request,
    );
    return response.data;
  },

  listBuildableUnitTypes(
    unitId: string,
    query: ListBuildableUnitsQuery = {},
  ): Promise<BuildableUnitType[]> {
    return dedupedGet<BuildableUnitType[]>(
      `/players/me/units/${encodeURIComponent(unitId)}/buildable`,
      { params: query },
    );
  },

  async startBuild(unitId: string, request: BuildUnitRequest): Promise<BuildOrderResult> {
    const response = await api.post<BuildOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/build`,
      request,
    );
    return response.data;
  },

  async stopBuild(unitId: string, request: StopUnitRequest): Promise<StopBuildOrderResult> {
    const response = await api.post<StopBuildOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/stop-build`,
      request,
    );
    return response.data;
  },

  async parkUnit(unitId: string, request: ParkUnitRequest): Promise<ParkOrderResult> {
    const response = await api.post<ParkOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/park`,
      request,
    );
    return response.data;
  },

  async unparkUnit(unitId: string, request: StopUnitRequest): Promise<UnparkOrderResult> {
    const response = await api.post<UnparkOrderResult>(
      `/players/me/units/${encodeURIComponent(unitId)}/unpark`,
      request,
    );
    return response.data;
  },

  async transferCargo(
    sourceUnitId: string,
    request: TransferCargoRequest,
  ): Promise<TransferCargoOrderResult> {
    const response = await api.post<TransferCargoOrderResult>(
      `/players/me/units/${encodeURIComponent(sourceUnitId)}/transfer-to`,
      request,
    );
    return response.data;
  },
};
