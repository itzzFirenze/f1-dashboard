import React from 'react';
import type { CircuitDRSZone } from '../../data/circuits';

interface ActiveAeroZoneProps {
   path: string;
   zone: CircuitDRSZone;
   active: boolean;
   onHover: (zone: CircuitDRSZone | null) => void;
}

const ActiveAeroZone: React.FC<ActiveAeroZoneProps> = ({ path, zone, active, onHover }) => {
   const span = zone.endPercent - zone.startPercent;
   return (
      <path
         d={path}
         pathLength={100}
         fill="none"
         stroke="#22d3ee"
         strokeWidth={active ? 17 : 11}
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeDasharray={`${span} ${100 - span}`}
         strokeDashoffset={-zone.startPercent}
         opacity={active ? 0.85 : 0.3}
         className="transition-all duration-300 cursor-pointer"
         onMouseEnter={() => onHover(zone)}
         onMouseLeave={() => onHover(null)}
      />
   );
};

export default ActiveAeroZone;