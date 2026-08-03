import React from 'react';
import type { CircuitDRSZone } from '../../data/circuits';

interface DRSZoneProps {
  path: string;
  zone: CircuitDRSZone;
  active: boolean;
  onHover: (zone: CircuitDRSZone | null) => void;
}

const DRSZone: React.FC<DRSZoneProps> = ({ path, zone, active, onHover }) => {
  const span = zone.endPercent - zone.startPercent;

  return (
    <path
      d={path}
      pathLength={100}
      fill="none"
      stroke="#22c55e"
      strokeWidth={active ? 24 : 16}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${span} ${100 - span}`}
      strokeDashoffset={-zone.startPercent}
      opacity={active ? 0.85 : 0.34}
      className="transition-all duration-300 cursor-pointer"
      onMouseEnter={() => onHover(zone)}
      onMouseLeave={() => onHover(null)}
    />
  );
};

export default DRSZone;
