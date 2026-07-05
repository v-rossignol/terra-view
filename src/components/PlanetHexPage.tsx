import { hasEnoughCargoForRecipe, getBuildFootprintCells } from '@infinity/shared-utils';
import { PLANET_GARAGE_RANGE_HEX } from '@infinity/shared-config';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePlanetHex } from '../hooks/usePlanetHex';
import { usePlanetUnitsWithSocket } from '../hooks/usePlanetSocket';
import { unitService } from '../services/unitService';
import type { HexCoords } from '../types/planet';
import type { UnitUpdatePayload } from '../types/socket';
import type { UnitInstance, UnitMovementTrack, BuildableUnitType, CargoResource } from '../types/unit';
import { buildMovementTrackFromUnit, movementTrackFromMoveOrder } from '../utils/unitMovementTrack';
import { useFollowSelectedMovingUnit } from '../hooks/useFollowSelectedMovingUnit';
import { useUnitsWithProjectedExtractionCargo } from '../hooks/useUnitsWithProjectedExtractionCargo';
import { formatHexCoords } from '../utils/hexCoords';
import { LOGIN_PATH } from '../utils/authErrors';
import { technicsPath } from '../utils/technics';
import { getExtractErrorMessage, getStopExtractionErrorMessage } from '../utils/extractErrors';
import { getDropCargoErrorMessage } from '../utils/dropErrors';
import { getMoveErrorMessage } from '../utils/moveErrors';
import { getStopErrorMessage } from '../utils/stopErrors';
import { getBuildErrorMessage } from '../utils/buildErrors';
import { getParkErrorMessage, getUnparkErrorMessage } from '../utils/parkErrors';
import { getTransferCargoErrorMessage } from '../utils/transferErrors';
import { findParkableGarages } from '../utils/unitParking';
import { SingleHexView, type MoveDestination } from './game/SingleHexView';
import { ClientHeader } from './ui/ClientHeader';
import { HexResourcesPanel } from './ui/HexResourcesPanel';
import { UnitPanel } from './ui/UnitPanel';
import { UnitCargoOverlay } from './ui/UnitCargoOverlay';
import { UnitExtractionOverlay } from './ui/UnitExtractionOverlay';
import { BuildingPanel } from './ui/BuildingPanel';
import { UnitGarageOverlay } from './ui/UnitGarageOverlay';
import type { Vec2Local } from '../types/player';
import { getUnitHexCoords, getUnitHexLocalPosition } from '../utils/unitLocation';
import { getBiomeAllowedMoveDestinationHexes } from '../utils/unitMovement';

const layoutStyle: React.CSSProperties = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#0f0f0f',
  color: '#f0f0f0',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  minHeight: 0,
  width: '100%',
  overflow: 'hidden',
  position: 'relative',
};

const centeredContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  padding: '1rem',
  overflow: 'auto',
};

const errorStyle: React.CSSProperties = {
  color: '#ff6b6b',
  maxWidth: '32rem',
  textAlign: 'center',
};

const linkStyle: React.CSSProperties = {
  color: '#7eb8ff',
  textDecoration: 'none',
};

const metaStyle: React.CSSProperties = {
  position: 'absolute',
  left: '1rem',
  bottom: '1rem',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border: '1px solid #3a3a3a',
  backgroundColor: 'rgba(20, 20, 20, 0.95)',
  fontSize: '0.8125rem',
  lineHeight: 1.45,
  zIndex: 10,
};

export function PlanetHexPage() {
  const navigate = useNavigate();
  const { planetId, q, r } = useParams();
  const {
    status,
    planetName,
    coords,
    hex,
    neighbors,
    hexResources,
    playerId,
    playerName,
    starName,
    starSystemHref,
    planetUnits,
    error,
    planetRadius,
  } = usePlanetHex(planetId, q, r);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [moveModeActive, setMoveModeActive] = useState(false);
  const [cargoPanelOpen, setCargoPanelOpen] = useState(false);
  const [extractPanelOpen, setExtractPanelOpen] = useState(false);
  const [buildingPanelOpen, setBuildingPanelOpen] = useState(false);
  const [garagePanelOpen, setGaragePanelOpen] = useState(false);
  const [garageAreaHovered, setGarageAreaHovered] = useState(false);
  const [buildModeUnit, setBuildModeUnit] = useState<BuildableUnitType | null>(null);
  const [pendingBuildPosition, setPendingBuildPosition] = useState<Vec2Local | null>(null);
  const [isSubmittingBuild, setIsSubmittingBuild] = useState(false);
  const [pendingMoveDestination, setPendingMoveDestination] = useState<MoveDestination | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [isSubmittingStop, setIsSubmittingStop] = useState(false);
  const [isSubmittingExtract, setIsSubmittingExtract] = useState(false);
  const [pendingExtractResourceId, setPendingExtractResourceId] = useState<string | null>(null);
  const [pendingDropResourceId, setPendingDropResourceId] = useState<string | null>(null);
  const [isSubmittingPark, setIsSubmittingPark] = useState(false);
  const [pendingParkGarageId, setPendingParkGarageId] = useState<string | null>(null);
  const [isSubmittingUnpark, setIsSubmittingUnpark] = useState(false);
  const [pendingUnparkVehicleId, setPendingUnparkVehicleId] = useState<string | null>(null);
  const [pendingTransferResourceId, setPendingTransferResourceId] = useState<string | null>(null);
  const [movementTracks, setMovementTracks] = useState<Record<string, UnitMovementTrack>>({});
  const selectedUnitIdRef = useRef<string | null>(null);
  const handleSocketUnitUpdate = useCallback((payload: UnitUpdatePayload) => {
    if (payload.status !== 'moving') {
      setMovementTracks((current) => {
        if (current[payload.unitId] == null) {
          return current;
        }

        const { [payload.unitId]: _removed, ...rest } = current;
        return rest;
      });
    }

    if (payload.unitId === selectedUnitIdRef.current && payload.status === 'idle') {
      setPendingMoveDestination(null);
    }
  }, []);
  const { units: displayUnits, patchUnit } = usePlanetUnitsWithSocket(
    planetId,
    planetUnits,
    handleSocketUnitUpdate,
  );
  const unitsWithProjectedCargo = useUnitsWithProjectedExtractionCargo(displayUnits, hexResources);

  useEffect(() => {
    if (status === 'unauthorized') {
      navigate(technicsPath('unauthorized'), { replace: true });
    }
  }, [navigate, status]);

  useEffect(() => {
    setMovementTracks((current) => {
      let changed = false;
      const next = { ...current };

      for (const unit of displayUnits) {
        if (unit.status === 'moving' && unit.type.type === 'vehicule' && next[unit.id] == null) {
          const track = buildMovementTrackFromUnit(unit);
          if (track != null) {
            next[unit.id] = track;
            changed = true;
          }
        }
      }

      for (const unitId of Object.keys(next)) {
        const unit = displayUnits.find((candidate) => candidate.id === unitId);
        if (unit == null || unit.status !== 'moving' || unit.type.type !== 'vehicule') {
          delete next[unitId];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [displayUnits]);

  useEffect(() => {
    if (!moveModeActive && !cargoPanelOpen && !extractPanelOpen && !buildingPanelOpen && !garagePanelOpen && buildModeUnit == null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (cargoPanelOpen) {
          setCargoPanelOpen(false);
        }
        if (extractPanelOpen) {
          setExtractPanelOpen(false);
        }
        if (buildingPanelOpen) {
          setBuildingPanelOpen(false);
        }
        if (garagePanelOpen) {
          setGaragePanelOpen(false);
          setGarageAreaHovered(false);
        }
        if (buildModeUnit != null) {
          setBuildModeUnit(null);
          setPendingBuildPosition(null);
        }
        if (moveModeActive) {
          setMoveModeActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveModeActive, cargoPanelOpen, extractPanelOpen, buildingPanelOpen, garagePanelOpen, buildModeUnit]);

  const selectedUnit = useMemo(
    () => displayUnits.find((unit) => unit.id === selectedUnitId) ?? null,
    [displayUnits, selectedUnitId],
  );
  const selectedUnitForDisplay = useMemo(
    () => unitsWithProjectedCargo.find((unit) => unit.id === selectedUnitId) ?? null,
    [unitsWithProjectedCargo, selectedUnitId],
  );

  const skipHexResetRef = useFollowSelectedMovingUnit({
    planetId,
    coords,
    planetRadius,
    selectedUnit,
    movementTracks,
  });

  useEffect(() => {
    if (skipHexResetRef.current) {
      skipHexResetRef.current = false;
      return;
    }

    setSelectedUnitId(null);
    setMoveModeActive(false);
    setCargoPanelOpen(false);
    setExtractPanelOpen(false);
    setBuildingPanelOpen(false);
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
    setBuildModeUnit(null);
    setPendingBuildPosition(null);
    setPendingMoveDestination(null);
    setMoveError(null);
  }, [coords?.q, coords?.r]);

  selectedUnitIdRef.current = selectedUnitId;

  const handleUnitSelect = useCallback((unit: UnitInstance) => {
    setMoveError(null);
    setSelectedUnitId((current) => {
      const next = current === unit.id ? null : unit.id;
      if (next == null) {
        setMoveModeActive(false);
        setCargoPanelOpen(false);
        setExtractPanelOpen(false);
        setBuildingPanelOpen(false);
        setGaragePanelOpen(false);
        setGarageAreaHovered(false);
        setBuildModeUnit(null);
        setPendingBuildPosition(null);
        setPendingMoveDestination(null);
      }
      return next;
    });
  }, []);

  const handleMoveClick = useCallback(() => {
    setMoveError(null);
    setCargoPanelOpen(false);
    setExtractPanelOpen(false);
    setBuildingPanelOpen(false);
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
    setBuildModeUnit(null);
    setPendingBuildPosition(null);
    setMoveModeActive((current) => !current);
  }, []);

  const handleCargoClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setExtractPanelOpen(false);
    setBuildingPanelOpen(false);
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
    setBuildModeUnit(null);
    setPendingBuildPosition(null);
    setCargoPanelOpen((current) => !current);
  }, []);

  const handleExtractClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setCargoPanelOpen(false);
    setBuildingPanelOpen(false);
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
    setBuildModeUnit(null);
    setPendingBuildPosition(null);
    setExtractPanelOpen((current) => !current);
  }, []);

  const handleBuildingClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setCargoPanelOpen(false);
    setExtractPanelOpen(false);
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
    setBuildModeUnit(null);
    setPendingBuildPosition(null);
    setBuildingPanelOpen((current) => !current);
  }, []);

  const handleGarageClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setCargoPanelOpen(false);
    setExtractPanelOpen(false);
    setBuildingPanelOpen(false);
    setBuildModeUnit(null);
    setPendingBuildPosition(null);
    setGaragePanelOpen((current) => {
      const next = !current;
      setGarageAreaHovered(next);
      return next;
    });
  }, []);

  const handleCargoOverlayClose = useCallback(() => {
    setCargoPanelOpen(false);
  }, []);

  const handleExtractOverlayClose = useCallback(() => {
    setExtractPanelOpen(false);
  }, []);

  const handleBuildingPanelClose = useCallback(() => {
    setBuildingPanelOpen(false);
  }, []);

  const handleGaragePanelClose = useCallback(() => {
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
  }, []);

  const isUnitBuildable = useCallback(
    (targetType: BuildableUnitType) => {
      if (selectedUnit == null || targetType.recipe == null) {
        return false;
      }

      return hasEnoughCargoForRecipe(selectedUnit.cargo, targetType.recipe.ingredients);
    },
    [selectedUnit],
  );

  const handleBuildUnit = useCallback((unit: BuildableUnitType) => {
    setMoveError(null);
    setMoveModeActive(false);
    setBuildingPanelOpen(false);
    setGaragePanelOpen(false);
    setGarageAreaHovered(false);
    setBuildModeUnit(unit);
    setPendingBuildPosition(null);
  }, []);

  const handleBuildTargetSelect = useCallback(
    (position: Vec2Local) => {
      if (
        selectedUnitId == null ||
        planetId == null ||
        coords == null ||
        buildModeUnit == null ||
        isSubmittingBuild
      ) {
        return;
      }

      setMoveError(null);
      setPendingBuildPosition(position);
      setIsSubmittingBuild(true);

      void unitService
        .startBuild(selectedUnitId, {
          planetId,
          targetTypeId: buildModeUnit.id,
          targetHex: coords,
          targetPosition: position,
        })
        .then((result) => {
          if (selectedUnit != null) {
            patchUnit({
              unitId: selectedUnitId,
              status: 'building',
              location: selectedUnit.location,
              metadata: {
                ...selectedUnit.metadata,
                building: {
                  targetTypeId: result.targetTypeId,
                  planetId,
                  hexCoords: coords,
                  position,
                  startedAt: result.startedAt,
                  completedAt: result.completedAt,
                },
              },
            });
          }
          setBuildModeUnit(null);
          setPendingBuildPosition(null);
        })
        .catch((error: unknown) => {
          setPendingBuildPosition(null);
          setMoveError(getBuildErrorMessage(error));
        })
        .finally(() => {
          setIsSubmittingBuild(false);
        });
    },
    [
      selectedUnitId,
      selectedUnit,
      planetId,
      coords,
      buildModeUnit,
      isSubmittingBuild,
      patchUnit,
    ],
  );

  const handleDropCargo = useCallback(
    (resource: { id: string; quantity: number }) => {
      if (selectedUnitId == null || planetId == null || pendingDropResourceId != null || selectedUnit == null) {
        return;
      }

      setMoveError(null);
      setPendingDropResourceId(resource.id);

      void unitService
        .dropCargo(selectedUnitId, {
          planetId,
          resource,
        })
        .then((result) => {
          const nextCargo = { ...selectedUnit.cargo };
          const remaining = (nextCargo[resource.id] ?? 0) - result.resource.quantity;

          if (remaining <= 0) {
            delete nextCargo[resource.id];
          } else {
            nextCargo[resource.id] = remaining;
          }

          patchUnit({
            unitId: selectedUnitId,
            status: 'idle',
            location: selectedUnit.location,
            cargo: nextCargo,
          });
        })
        .catch((error: unknown) => {
          setMoveError(getDropCargoErrorMessage(error));
        })
        .finally(() => {
          setPendingDropResourceId(null);
        });
    },
    [selectedUnitId, selectedUnit, planetId, pendingDropResourceId, patchUnit],
  );

  const handleStartExtract = useCallback(
    (resourceType: string) => {
      if (selectedUnitId == null || planetId == null || isSubmittingExtract) {
        return;
      }

      setMoveError(null);
      setPendingExtractResourceId(resourceType);
      setIsSubmittingExtract(true);

      void unitService
        .startExtract(selectedUnitId, { planetId, resourceType })
        .then((result) => {
          if (selectedUnit != null && coords != null) {
            patchUnit({
              unitId: selectedUnitId,
              status: 'extracting',
              location: selectedUnit.location,
              metadata: {
                ...selectedUnit.metadata,
                extraction: {
                  resourceType: result.resourceType,
                  planetId,
                  hexCoords: coords,
                  startedAt: result.startedAt,
                  lastTickAt: result.startedAt,
                },
              },
            });
          }
          setExtractPanelOpen(false);
        })
        .catch((error: unknown) => {
          setMoveError(getExtractErrorMessage(error));
        })
        .finally(() => {
          setIsSubmittingExtract(false);
          setPendingExtractResourceId(null);
        });
    },
    [selectedUnitId, selectedUnit, planetId, coords, isSubmittingExtract, patchUnit],
  );

  const handleStopClick = useCallback(() => {
    if (selectedUnitId == null || planetId == null || isSubmittingStop || selectedUnit == null) {
      return;
    }

    setMoveError(null);
    setIsSubmittingStop(true);

    const isExtracting = selectedUnit.status === 'extracting';
    const isBuilding = selectedUnit.status === 'building';
    const stopRequest = isExtracting
      ? unitService.stopExtraction(selectedUnitId, { planetId })
      : isBuilding
        ? unitService.stopBuild(selectedUnitId, { planetId })
        : unitService.stopUnit(selectedUnitId, { planetId });

    void stopRequest
      .catch((error: unknown) => {
        setMoveError(
          isExtracting
            ? getStopExtractionErrorMessage(error)
            : isBuilding
              ? getBuildErrorMessage(error)
              : getStopErrorMessage(error),
        );
      })
      .finally(() => {
        setIsSubmittingStop(false);
      });
  }, [selectedUnitId, selectedUnit, planetId, isSubmittingStop]);

  const handleParkClick = useCallback(
    (garageUnitId: string) => {
      if (
        selectedUnitId == null ||
        selectedUnit == null ||
        planetId == null ||
        isSubmittingPark
      ) {
        return;
      }

      setMoveError(null);
      setPendingParkGarageId(garageUnitId);
      setIsSubmittingPark(true);

      void unitService
        .parkUnit(selectedUnitId, { planetId, garageUnitId })
        .then((result) => {
          patchUnit({
            unitId: selectedUnitId,
            status: 'inactive',
            location: selectedUnit.location,
            metadata: {
              ...selectedUnit.metadata,
              parking: {
                garageUnitId: result.garageUnitId,
                parkedAt: new Date().toISOString(),
              },
            },
          });
        })
        .catch((error: unknown) => {
          setMoveError(getParkErrorMessage(error));
        })
        .finally(() => {
          setIsSubmittingPark(false);
          setPendingParkGarageId(null);
        });
    },
    [selectedUnitId, selectedUnit, planetId, isSubmittingPark, patchUnit],
  );

  const handleUnpark = useCallback(
    (vehicleUnitId: string) => {
      if (selectedUnit == null || planetId == null || isSubmittingUnpark) {
        return;
      }

      const vehicle = displayUnits.find((unit) => unit.id === vehicleUnitId);
      if (vehicle == null) {
        return;
      }

      setMoveError(null);
      setPendingUnparkVehicleId(vehicleUnitId);
      setIsSubmittingUnpark(true);

      void unitService
        .unparkUnit(vehicleUnitId, { planetId })
        .then(() => {
          const { parking: _parking, ...restMetadata } = vehicle.metadata;
          patchUnit({
            unitId: vehicleUnitId,
            status: 'idle',
            location: vehicle.location,
            metadata: restMetadata,
          });
          handleGaragePanelClose();
        })
        .catch((error: unknown) => {
          setMoveError(getUnparkErrorMessage(error));
        })
        .finally(() => {
          setIsSubmittingUnpark(false);
          setPendingUnparkVehicleId(null);
        });
    },
    [selectedUnit, planetId, isSubmittingUnpark, displayUnits, patchUnit, handleGaragePanelClose],
  );

  const handleTransferCargo = useCallback(
    ({
      sourceUnitId,
      targetUnitId,
      resource,
    }: {
      sourceUnitId: string;
      targetUnitId: string;
      resource: CargoResource;
    }) => {
      if (planetId == null || pendingTransferResourceId != null) {
        return;
      }

      const sourceUnit = displayUnits.find((unit) => unit.id === sourceUnitId);
      const targetUnit = displayUnits.find((unit) => unit.id === targetUnitId);

      if (sourceUnit == null || targetUnit == null) {
        return;
      }

      setMoveError(null);
      setPendingTransferResourceId(resource.id);

      void unitService
        .transferCargo(sourceUnitId, {
          planetId,
          targetUnitId,
          resources: [resource],
        })
        .then((result) => {
          const sourceCargo = { ...sourceUnit.cargo };
          const targetCargo = { ...targetUnit.cargo };

          for (const transferred of result.transferred) {
            const remaining = (sourceCargo[transferred.id] ?? 0) - transferred.quantity;

            if (remaining <= 0) {
              delete sourceCargo[transferred.id];
            } else {
              sourceCargo[transferred.id] = remaining;
            }

            targetCargo[transferred.id] = (targetCargo[transferred.id] ?? 0) + transferred.quantity;
          }

          patchUnit({
            unitId: sourceUnitId,
            status: sourceUnit.status,
            location: sourceUnit.location,
            cargo: sourceCargo,
          });
          patchUnit({
            unitId: targetUnitId,
            status: targetUnit.status,
            location: targetUnit.location,
            cargo: targetCargo,
          });
        })
        .catch((error: unknown) => {
          setMoveError(getTransferCargoErrorMessage(error));
        })
        .finally(() => {
          setPendingTransferResourceId(null);
        });
    },
    [planetId, pendingTransferResourceId, displayUnits, patchUnit],
  );

  const handleMoveDestinationSelect = useCallback(
    (hex_coords: HexCoords, position: Vec2Local) => {
      if (selectedUnitId == null || planetId == null || isSubmittingMove) {
        return;
      }

      setMoveError(null);
      setPendingMoveDestination({ hex_coords, position });
      setMoveModeActive(false);
      setIsSubmittingMove(true);

      void unitService
        .startMove(selectedUnitId, {
          planetId,
          targetHex: hex_coords,
          targetPosition: position,
        })
        .then((result) => {
          setMovementTracks((current) => ({
            ...current,
            [result.unitId]: movementTrackFromMoveOrder(result),
          }));

          if (selectedUnit != null) {
            patchUnit({
              unitId: selectedUnitId,
              status: 'moving',
              location: selectedUnit.location,
            });
          }
        })
        .catch((error: unknown) => {
          setPendingMoveDestination(null);
          setMoveError(getMoveErrorMessage(error));
        })
        .finally(() => {
          setIsSubmittingMove(false);
        });
    },
    [selectedUnitId, selectedUnit, planetId, isSubmittingMove, patchUnit],
  );

  const validMoveHexes = useMemo(() => {
    if (selectedUnit == null || coords == null || planetRadius == null || hex == null) {
      return [];
    }

    const origin = getUnitHexCoords(selectedUnit) ?? coords;
    return getBiomeAllowedMoveDestinationHexes(
      origin,
      planetRadius,
      [hex, ...neighbors],
      selectedUnit.type.environments,
    );
  }, [selectedUnit, coords, planetRadius, hex, neighbors]);

  const parkTargets = useMemo(() => {
    if (selectedUnit == null || playerId == null || planetRadius == null) {
      return [];
    }

    return findParkableGarages(selectedUnit, displayUnits, planetRadius, playerId).map(
      (garage) => ({
        garageUnitId: garage.unitId,
        garageName: garage.name,
      }),
    );
  }, [selectedUnit, displayUnits, planetRadius, playerId]);

  const garageAreaPreview = useMemo(() => {
    if ((!garageAreaHovered && !garagePanelOpen) || selectedUnit == null || coords == null) {
      return null;
    }

    if (selectedUnit.type.capabilities.garage == null) {
      return null;
    }

    const unitHex = getUnitHexCoords(selectedUnit);
    if (unitHex == null || unitHex.q !== coords.q || unitHex.r !== coords.r) {
      return null;
    }

    const center = getUnitHexLocalPosition(selectedUnit);
    if (center == null) {
      return null;
    }

    return {
      center,
      radiusHex: PLANET_GARAGE_RANGE_HEX,
    };
  }, [garageAreaHovered, garagePanelOpen, selectedUnit, coords]);

  const handleNeighborClick = useCallback(
    (neighborCoords: HexCoords) => {
      if (planetId == null) {
        return;
      }

      navigate(`/${planetId}/${neighborCoords.q}/${neighborCoords.r}`);
    },
    [navigate, planetId],
  );

  const headerStatus =
    playerName != null && planetName != null
      ? 'ready'
      : status === 'loading' || status === 'unauthorized'
        ? 'loading'
        : 'error';

  const hexDetail = coords != null ? `Hex ${formatHexCoords(coords)}` : null;

  return (
    <div style={layoutStyle}>
      <ClientHeader
        playerName={playerName}
        starName={starName}
        starSystemHref={starSystemHref}
        planetName={planetName}
        planetTo="/"
        detail={hexDetail}
        status={headerStatus}
      />

      <main style={status === 'ready' && hex != null ? contentStyle : centeredContentStyle}>
        {(status === 'loading' || status === 'unauthorized') && (
          <p style={{ color: '#9a9a9a' }}>Loading hex…</p>
        )}

        {status === 'error' && error != null && (
          <>
            <p style={errorStyle} role="alert">
              {error}
            </p>
            {error.includes(LOGIN_PATH) ? (
              <a href={LOGIN_PATH} style={linkStyle}>
                Go to Stellar Gate
              </a>
            ) : (
              <Link to="/" style={linkStyle}>
                Back to planet surface
              </Link>
            )}
          </>
        )}

        {status === 'ready' && hex != null && coords != null && planetRadius != null && (
          <>
            <SingleHexView
              hex={hex}
              radius={planetRadius}
              neighbors={neighbors}
              playerId={playerId ?? undefined}
              planetUnits={displayUnits}
              selectedUnitId={selectedUnitId}
              onUnitSelect={handleUnitSelect}
              onNeighborClick={handleNeighborClick}
              moveModeActive={moveModeActive}
              validMoveHexes={validMoveHexes}
              pendingMoveDestination={pendingMoveDestination}
              movementTracks={movementTracks}
              onMoveDestinationSelect={handleMoveDestinationSelect}
              buildModeActive={buildModeUnit != null}
              buildFootprintCells={
                buildModeUnit != null ? getBuildFootprintCells(buildModeUnit.size) : 1
              }
              pendingBuildPosition={pendingBuildPosition}
              onBuildTargetSelect={handleBuildTargetSelect}
              garageAreaPreview={garageAreaPreview}
            />
            <UnitPanel
              unit={selectedUnitForDisplay}
              moveModeActive={moveModeActive}
              cargoPanelOpen={cargoPanelOpen}
              extractPanelOpen={extractPanelOpen}
              buildingPanelOpen={buildingPanelOpen}
              garagePanelOpen={garagePanelOpen}
              moveError={moveError}
              moveDisabled={isSubmittingMove || selectedUnit?.status === 'moving'}
              extractDisabled={
                isSubmittingExtract ||
                selectedUnit?.status === 'moving' ||
                selectedUnit?.status === 'extracting'
              }
              buildingDisabled={
                selectedUnit?.status === 'moving' ||
                selectedUnit?.status === 'extracting' ||
                selectedUnit?.status === 'building'
              }
              stopDisabled={isSubmittingStop}
              onMoveClick={handleMoveClick}
              onCargoClick={handleCargoClick}
              onExtractClick={handleExtractClick}
              onBuildingClick={handleBuildingClick}
              onGarageClick={handleGarageClick}
              onStopClick={handleStopClick}
              onGarageHoverChange={setGarageAreaHovered}
              parkTargets={parkTargets}
              parkDisabled={isSubmittingPark || selectedUnit?.status !== 'idle'}
              pendingParkGarageId={pendingParkGarageId}
              onParkClick={handleParkClick}
            />
            {cargoPanelOpen && selectedUnitForDisplay != null ? (
              <UnitCargoOverlay
                unit={selectedUnitForDisplay}
                onClose={handleCargoOverlayClose}
                onDrop={handleDropCargo}
                droppingResourceId={pendingDropResourceId}
              />
            ) : null}
            {extractPanelOpen && selectedUnit != null ? (
              <UnitExtractionOverlay
                unit={selectedUnit}
                biome={hex.biome}
                extractError={moveError}
                pendingResourceId={pendingExtractResourceId}
                onClose={handleExtractOverlayClose}
                onStartExtract={handleStartExtract}
              />
            ) : null}
            {buildingPanelOpen && selectedUnit != null ? (
              <BuildingPanel
                unit={selectedUnit}
                planetId={planetId ?? null}
                hexCoords={coords}
                onClose={handleBuildingPanelClose}
                onBuild={handleBuildUnit}
                isBuildable={isUnitBuildable}
              />
            ) : null}
            {garagePanelOpen && selectedUnit != null ? (
              <UnitGarageOverlay
                unit={selectedUnit}
                planetUnits={displayUnits}
                onClose={handleGaragePanelClose}
                onUnpark={handleUnpark}
                unparkingVehicleId={pendingUnparkVehicleId}
                onTransferCargo={handleTransferCargo}
                transferringResourceId={pendingTransferResourceId}
                transferError={moveError}
              />
            ) : null}
            <aside style={metaStyle}>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 600 }}>{hex.biome}</p>
              <p style={{ margin: 0, color: '#b0b0b0' }}>Danger level: {hex.dangerLevel}</p>
            </aside>
            <HexResourcesPanel
              hoveredHex={coords}
              hexResources={hexResources}
              status={hexResources != null ? 'ready' : 'error'}
              error={hexResources == null ? 'Failed to load hex resources.' : null}
            />
          </>
        )}
      </main>
    </div>
  );
}
