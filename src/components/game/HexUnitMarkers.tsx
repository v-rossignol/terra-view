import type { UnitInstance } from '../../types/unit';
import { hexLocalPositionToPercent } from '../../utils/hexLocalPosition';
import { getUnitHexLocalPosition } from '../../utils/unitLocation';
import { getUnitSprite } from '../../utils/unitSprites';

export interface HexUnitMarkersProps {
  units: UnitInstance[];
  playerId?: string;
  ownUnitMarker?: 'dot' | 'sprite';
  selectable?: boolean;
  selectedUnitId?: string | null;
  onUnitSelect?: (unit: UnitInstance) => void;
}

export function HexUnitMarkers({
  units,
  playerId,
  ownUnitMarker = 'dot',
  selectable = false,
  selectedUnitId = null,
  onUnitSelect,
}: HexUnitMarkersProps) {
  if (units.length === 0) {
    return null;
  }

  const unitsClassName = ['hex-grid__units', selectable ? 'hex-grid__units--selectable' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={unitsClassName}>
      {units.map((unit) => {
        const isOwnUnit = playerId != null && unit.ownerId === playerId;
        const useOwnDot = isOwnUnit && ownUnitMarker === 'dot';
        const sprite = useOwnDot ? undefined : getUnitSprite(unit.typeId);
        const isSelected = selectedUnitId === unit.id;
        const isMovingVehicule = unit.status === 'moving' && unit.type.type === 'vehicule';
        const unitClassName = [
          'hex-grid__unit',
          useOwnDot ? 'hex-grid__unit--own' : '',
          sprite != null ? 'hex-grid__unit--sprite' : '',
          isSelected ? 'hex-grid__unit--selected' : '',
          selectable ? 'hex-grid__unit--selectable' : '',
          isMovingVehicule ? 'hex-grid__unit--moving' : '',
          !useOwnDot && sprite == null && unit.type.type === 'building'
            ? 'hex-grid__unit--building'
            : !useOwnDot && sprite == null
              ? 'hex-grid__unit--vehicule'
              : '',
        ]
          .filter(Boolean)
          .join(' ');

        const position = getUnitHexLocalPosition(unit) ?? { x: 0.5, y: 0.5 };
        const { left, top } = hexLocalPositionToPercent(position);
        const commonProps = {
          className: unitClassName,
          style: {
            left,
            top,
            ...(sprite != null ? { backgroundImage: `url(${sprite})` } : {}),
          },
          title: unit.type.name,
          'aria-label': unit.type.name,
          'aria-pressed': selectable ? isSelected : undefined,
        };

        if (selectable) {
          return (
            <button
              key={unit.id}
              type="button"
              {...commonProps}
              onClick={(event) => {
                event.stopPropagation();
                onUnitSelect?.(unit);
              }}
            />
          );
        }

        return <span key={unit.id} {...commonProps} />;
      })}
    </div>
  );
}
