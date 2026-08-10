import React from 'react';
import { Gauge } from 'lucide-react';
import type { SpeedTrap } from '../../data/circuits';
import { usePathPoint } from './usePathPoint';

interface SpeedTrapMarkerProps {
   speedTrap: SpeedTrap;
   pathId: string;
   onHover: (speedTrap: SpeedTrap | null) => void;
}

const SpeedTrapMarker: React.FC<SpeedTrapMarkerProps> = ({ speedTrap, pathId, onHover }) => {
   const point = usePathPoint(pathId, speedTrap.positionPercent);

   return (
      <g
         transform={`translate(${point.x} ${point.y})`}
         className="cursor-help"
         onMouseEnter={() => onHover(speedTrap)}
         onMouseLeave={() => onHover(null)}
      >
         <circle r="15" fill="#0f172a" stroke="#f97316" strokeWidth="2" />
         <foreignObject x="-8" y="-8" width="16" height="16">
            <Gauge className="w-4 h-4 text-orange-300" />
         </foreignObject>
      </g>
   );
};

export default SpeedTrapMarker;