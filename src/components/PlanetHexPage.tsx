import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePlanetHex } from '../hooks/usePlanetHex';
import { usePlanetUnitsWithSocket } from '../hooks/usePlanetSocket';
import { unitService } from '../services/unitService';
import type { HexCoords } from '../types/planet';
import type { UnitUpdatePayload } from '../types/socket';
import type { UnitInstance, UnitMovementTrack } from '../types/unit';
import { buildMovementTrackFromUnit, movementTrackFromMoveOrder } from '../utils/unitMovementTrack';
import { useFollowSelectedMovingUnit } from '../hooks/useFollowSelectedMovingUnit';
import { formatHexCoords } from '../utils/hexCoords';
import { LOGIN_PATH } from '../utils/authErrors';
import { technicsPath } from '../utils/technics';
import { getExtractErrorMessage, getStopExtractionErrorMessage } from '../utils/extractErrors';
import { getDropCargoErrorMessage } from '../utils/dropErrors';
import { getMoveErrorMessage } from '../utils/moveErrors';
import { getStopErrorMessage } from '../utils/stopErrors';
import { SingleHexView, type MoveDestination } from './game/SingleHexView';
import { ClientHeader } from './ui/ClientHeader';
import { HexResourcesPanel } from './ui/HexResourcesPanel';
import { UnitPanel } from './ui/UnitPanel';
import { UnitCargoOverlay } from './ui/UnitCargoOverlay';
import { UnitExtractionOverlay } from './ui/UnitExtractionOverlay';
import { BuildingPanel } from './ui/BuildingPanel';
import type { Vec2Local } from '../types/player';
import { getUnitHexCoords } from '../utils/unitLocation';
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
  const [pendingMoveDestination, setPendingMoveDestination] = useState<MoveDestination | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [isSubmittingStop, setIsSubmittingStop] = useState(false);
  const [isSubmittingExtract, setIsSubmittingExtract] = useState(false);
  const [pendingExtractResourceId, setPendingExtractResourceId] = useState<string | null>(null);
  const [pendingDropResourceId, setPendingDropResourceId] = useState<string | null>(null);
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
    if (!moveModeActive && !cargoPanelOpen && !extractPanelOpen && !buildingPanelOpen) {
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
        if (moveModeActive) {
          setMoveModeActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveModeActive, cargoPanelOpen, extractPanelOpen, buildingPanelOpen]);

  const selectedUnit = useMemo(
    () => displayUnits.find((unit) => unit.id === selectedUnitId) ?? null,
    [displayUnits, selectedUnitId],
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
    setMoveModeActive((current) => !current);
  }, []);

  const handleCargoClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setExtractPanelOpen(false);
    setBuildingPanelOpen(false);
    setCargoPanelOpen((current) => !current);
  }, []);

  const handleExtractClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setCargoPanelOpen(false);
    setBuildingPanelOpen(false);
    setExtractPanelOpen((current) => !current);
  }, []);

  const handleBuildingClick = useCallback(() => {
    setMoveError(null);
    setMoveModeActive(false);
    setCargoPanelOpen(false);
    setExtractPanelOpen(false);
    setBuildingPanelOpen((current) => !current);
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
          resourceType: resource.id,
          amount: resource.quantity,
        })
        .then((result) => {
          const nextCargo = { ...selectedUnit.cargo };
          const remaining = (nextCargo[resource.id] ?? 0) - result.droppedAmount;

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
        .then(() => {
          if (selectedUnit != null) {
            patchUnit({
              unitId: selectedUnitId,
              status: 'extracting',
              location: selectedUnit.location,
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
    [selectedUnitId, selectedUnit, planetId, isSubmittingExtract, patchUnit],
  );

  const handleStopClick = useCallback(() => {
    if (selectedUnitId == null || planetId == null || isSubmittingStop || selectedUnit == null) {
      return;
    }

    setMoveError(null);
    setIsSubmittingStop(true);

    const isExtracting = selectedUnit.status === 'extracting';
    const stopRequest = isExtracting
      ? unitService.stopExtraction(selectedUnitId, { planetId })
      : unitService.stopUnit(selectedUnitId, { planetId });

    void stopRequest
      .catch((error: unknown) => {
        setMoveError(isExtracting ? getStopExtractionErrorMessage(error) : getStopErrorMessage(error));
      })
      .finally(() => {
        setIsSubmittingStop(false);
      });
  }, [selectedUnitId, selectedUnit, planetId, isSubmittingStop]);

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
            />
            <UnitPanel
              unit={selectedUnit}
              moveModeActive={moveModeActive}
              cargoPanelOpen={cargoPanelOpen}
              extractPanelOpen={extractPanelOpen}
              buildingPanelOpen={buildingPanelOpen}
              moveError={moveError}
              moveDisabled={isSubmittingMove || selectedUnit?.status === 'moving'}
              extractDisabled={
                isSubmittingExtract ||
                selectedUnit?.status === 'moving' ||
                selectedUnit?.status === 'extracting'
              }
              buildingDisabled={
                selectedUnit?.status === 'moving' ||
                selectedUnit?.status === 'extracting'
              }
              stopDisabled={isSubmittingStop}
              onMoveClick={handleMoveClick}
              onCargoClick={handleCargoClick}
              onExtractClick={handleExtractClick}
              onBuildingClick={handleBuildingClick}
              onStopClick={handleStopClick}
            />
            {cargoPanelOpen && selectedUnit != null ? (
              <UnitCargoOverlay
                unit={selectedUnit}
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
