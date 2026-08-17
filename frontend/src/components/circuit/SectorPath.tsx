import React from 'react';
import type { Sector } from '../../data/circuits';
import { usePathLength } from './usePathLength';

const colors: Record<Sector['id'], string> = {
   1: '#ef4444',
   2: '#38bdf8',
   3: '#facc15',
};

interface SectorPathProps {
   path: string;
   pathId: string;
   sector: Sector;
   active: boolean;
   onHover: (sector: Sector | null) => void;
}

const SectorPath: React.FC<SectorPathProps> = ({ path, pathId, sector, active, onHover }) => {
   const totalLength = usePathLength(pathId);
   if (!totalLength) return null;

   const arcStartPercent = sector.isReversed ? sector.endPercent : sector.startPercent;

   const onLen = (sector.lengthPercent / 100) * totalLength;
   const offset = -(arcStartPercent / 100) * totalLength;

   return (
      <path
         d={path}
         fill="none"
         stroke={colors[sector.id]}
         strokeWidth={active ? 18 : 10}
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeDasharray={`${onLen} ${totalLength - onLen}`}
         strokeDashoffset={offset}
         opacity={active ? 0.95 : 0.42}
         className="transition-all duration-300 cursor-crosshair"
         onMouseEnter={() => onHover(sector)}
         onMouseLeave={() => onHover(null)}
      />
   );
};

export default SectorPath;