import React from 'react';

import type { ActiveAeroZone as ActiveAeroZoneType } from '../../data/circuits';
import { usePathLength } from './usePathLength';

interface ActiveAeroZoneProps {
   path: string;
   pathId: string;
   zone: ActiveAeroZoneType;
   active: boolean;
   onHover: (zone: ActiveAeroZoneType | null) => void;
}

const ActiveAeroZone: React.FC<ActiveAeroZoneProps> = ({
   path,
   pathId,
   zone,
   active,
   onHover,
}) => {
   const totalLength = usePathLength(pathId);

   if (!totalLength) return null;

   const span = zone.endPercent - zone.startPercent;
   const onLen = (span / 100) * totalLength;
   const offset = -(zone.startPercent / 100) * totalLength;

   return (
      <path
         d={path}
         fill="none"
         stroke="#22d3ee"
         strokeWidth={active ? 17 : 11}
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeDasharray={`${onLen} ${totalLength - onLen}`}
         strokeDashoffset={offset}
         opacity={active ? 0.85 : 0.3}
         style={active ? { filter: 'drop-shadow(0 0 6px #22d3ee80)' } : undefined}
         className="transition-all duration-300 cursor-pointer"
         onMouseEnter={() => onHover(zone)}
         onMouseLeave={() => onHover(null)}
      />
   );
};

export default ActiveAeroZone;