import { buildFootprintToCssRect } from '../../utils/buildFootprintStyle';
import {
  computeBuildProgressPercent,
  type ConstructionSite,
} from '../../utils/unitBuilding';

export interface ConstructionSiteOverlayProps {
  site: ConstructionSite;
  nowMs: number;
}

export function ConstructionSiteOverlay({ site, nowMs }: ConstructionSiteOverlayProps) {
  const percent = computeBuildProgressPercent(site.startedAt, site.completedAt, nowMs);

  return (
    <div className="hex-grid__construction-overlay" aria-hidden="true">
      <span
        className="hex-grid__construction-footprint"
        style={buildFootprintToCssRect(site.position, site.footprintCells)}
      >
        <span className="hex-grid__construction-label">{site.targetName}</span>
        <span className="hex-grid__construction-progress">{percent}%</span>
      </span>
    </div>
  );
}
