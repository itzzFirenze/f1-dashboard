import React from 'react';
import { usePathPoint } from './usePathPoint';

interface FinishLineMarkerProps {
   pathId: string;
   positionPercent: number;
   onHover: (hovered: boolean) => void;
}

const FinishLineMarker: React.FC<FinishLineMarkerProps> = ({ pathId, positionPercent, onHover }) => {
   const point = usePathPoint(pathId, positionPercent);
   const patternId = `checker-${pathId}`;
   const cell = 3; // px per square
   const cols = 4;
   const rows = 4;
   const size = cell * cols; // 12

   return (
      <g
         transform={`translate(${point.x} ${point.y})`}
         className="cursor-help"
         onMouseEnter={() => onHover(true)}
         onMouseLeave={() => onHover(false)}
      >
         <defs>
            <pattern id={patternId} width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
               <rect width={cell * 2} height={cell * 2} fill="#f8fafc" />
               <rect width={cell} height={cell} fill="#111827" />
               <rect x={cell} y={cell} width={cell} height={cell} fill="#111827" />
            </pattern>
         </defs>
         <rect
            x={-size / 2}
            y={-size / 2}
            width={size}
            height={size}
            fill={`url(#${patternId})`}
            stroke="#f8fafc"
            strokeWidth="1"
         />
      </g>
   );
};

export default FinishLineMarker;