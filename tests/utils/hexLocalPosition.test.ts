import { describe, expect, it } from 'vitest';
import {
  clientPointToHexLocalAt,
  resolveClusterHexClick,
  type ClusterHexCell,
} from '../../src/utils/hexLocalPosition';

const containerRect = { left: 100, top: 50 };

const focusCell: ClusterHexCell = {
  cellCoords: { q: 2, r: 3 },
  isFocus: true,
  left: 300,
  top: 200,
  hexUnits: [],
  isMoveTarget: false,
  isNeighborClickable: false,
};

const neighborCell: ClusterHexCell = {
  cellCoords: { q: 2, r: 4 },
  isFocus: false,
  left: 300,
  top: 320,
  hexUnits: [],
  isMoveTarget: false,
  isNeighborClickable: true,
};

describe('resolveClusterHexClick', () => {
  it('prefers a neighbor over focus when both hex polygons contain the point', () => {
    const hexWidth = 200;
    const hexHeight = 160;
    const clientX = containerRect.left + focusCell.left + hexWidth * 0.5;
    const clientY = containerRect.top + focusCell.top + hexHeight * 0.88;

    expect(clientPointToHexLocalAt(
      focusCell.left,
      focusCell.top,
      hexWidth,
      hexHeight,
      containerRect,
      clientX,
      clientY,
    )).not.toBeNull();
    expect(clientPointToHexLocalAt(
      neighborCell.left,
      neighborCell.top,
      hexWidth,
      hexHeight,
      containerRect,
      clientX,
      clientY,
    )).not.toBeNull();

    const resolved = resolveClusterHexClick(
      [focusCell, neighborCell],
      hexWidth,
      hexHeight,
      containerRect,
      clientX,
      clientY,
    );

    expect(resolved?.cell).toEqual(neighborCell);
  });

  it('resolves the focus hex when the point is only inside the focus polygon', () => {
    const hexWidth = 200;
    const hexHeight = 160;
    const clientX = containerRect.left + focusCell.left + hexWidth * 0.5;
    const clientY = containerRect.top + focusCell.top + hexHeight * 0.5;

    const resolved = resolveClusterHexClick(
      [focusCell, neighborCell],
      hexWidth,
      hexHeight,
      containerRect,
      clientX,
      clientY,
    );

    expect(resolved?.cell).toEqual(focusCell);
  });
});
