import React from 'react';
import { usePitLanePath } from './usePitLanePath';
import type { PitLane } from '../../data/circuits/types';

interface PitLaneOverlayProps {
   pathId: string;
   pitLane: PitLane;
   isReversed?: boolean;
   onHover: (h: boolean) => void;
}

const PitLaneOverlay: React.FC<PitLaneOverlayProps> = ({ pathId, pitLane, isReversed = false, onHover }) => {
   const { d, entryPoint, exitPoint } = usePitLanePath(
      pathId,
      pitLane.entryPercent,
      pitLane.exitPercent,
      pitLane.offsetPx,
      isReversed
   );
   if (!d) return null;

   return (
      <g className="cursor-pointer" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
         <path d={d} fill="none" stroke="#a3a3a3" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
         <path d={d} fill="none" stroke="#facc15" strokeWidth="1.2" strokeDasharray="3 2" strokeLinecap="round" strokeLinejoin="round" />
         {entryPoint && <circle cx={entryPoint.x} cy={entryPoint.y} r="3.5" fill="#facc15" stroke="#0b0e14" strokeWidth="1" />}
         {exitPoint && <circle cx={exitPoint.x} cy={exitPoint.y} r="3.5" fill="#4ade80" stroke="#0b0e14" strokeWidth="1" />}
      </g>
   );
};

export default PitLaneOverlay;