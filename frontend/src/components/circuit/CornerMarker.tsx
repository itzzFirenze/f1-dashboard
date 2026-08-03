import React from 'react';
import type { CircuitCornerMarker } from '../../data/circuits';
import { usePathPoint } from './usePathPoint';

interface CornerMarkerProps {
  corner: CircuitCornerMarker;
  pathId: string;
  selected: boolean;
  onHover: (corner: CircuitCornerMarker | null) => void;
  onSelect: (corner: CircuitCornerMarker) => void;
}

const CornerMarker: React.FC<CornerMarkerProps> = ({ corner, pathId, selected, onHover, onSelect }) => {
  const point = usePathPoint(pathId, corner.positionPercent);

  return (
    <g
      transform={`translate(${point.x} ${point.y})`}
      className="cursor-pointer"
      onMouseEnter={() => onHover(corner)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(corner)}
    >
      <circle r={selected ? 13 : 10} fill={selected ? '#E10600' : '#15151E'} stroke="#F5F5F5" strokeWidth={2.4} className="transition-all duration-200" />
      <text y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill="#F5F5F5">{corner.number}</text>
    </g>
  );
};

export default CornerMarker;
