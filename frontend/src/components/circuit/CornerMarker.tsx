import React, { useState } from 'react';
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
   const [isHovered, setIsHovered] = useState(false);

   const active = selected || isHovered;

   return (
      <g
         transform={`translate(${point.x} ${point.y})`}
         className="cursor-pointer transition-all duration-200"
         opacity={active ? 1 : 0.8}
         onMouseEnter={() => {
            setIsHovered(true);
            onHover(corner);
         }}
         onMouseLeave={() => {
            setIsHovered(false);
            onHover(null);
         }}
         onClick={() => onSelect(corner)}
      >
         <circle
            r={active ? 7 : 5.2}
            fill={selected ? '#E10600' : '#15151E'}
            stroke={selected ? '#FFFFFF' : '#E2E8F0'}
            strokeWidth={active ? 1.3 : 1.0}
            className="transition-all duration-200"
         />
         <text
            y="2"
            textAnchor="middle"
            fontSize={active ? "6.5" : "5.8"}
            fontWeight="700"
            fill="#FFFFFF"
            className="select-none pointer-events-none transition-all duration-200"
         >
            {corner.number}
         </text>
      </g>
   );
};

export default CornerMarker;