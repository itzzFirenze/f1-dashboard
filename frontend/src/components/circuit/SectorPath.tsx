import React from 'react';
import type { Sector } from '../../data/circuits';

const colors: Record<Sector['id'], string> = {
  1: '#ef4444',
  2: '#38bdf8',
  3: '#facc15',
};

interface SectorPathProps {
  path: string;
  sector: Sector;
  active: boolean;
  onHover: (sector: Sector | null) => void;
}

const SectorPath: React.FC<SectorPathProps> = ({ path, sector, active, onHover }) => {
  const span = sector.endPercent - sector.startPercent;

  return (
    <path
      d={path}
      pathLength={100}
      fill="none"
      stroke={colors[sector.id]}
      strokeWidth={active ? 18 : 10}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${span} ${100 - span}`}
      strokeDashoffset={-sector.startPercent}
      opacity={active ? 0.95 : 0.42}
      className="transition-all duration-300 cursor-crosshair"
      onMouseEnter={() => onHover(sector)}
      onMouseLeave={() => onHover(null)}
    />
  );
};

export default SectorPath;
