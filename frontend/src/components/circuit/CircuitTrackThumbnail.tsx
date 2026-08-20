import React, { useEffect, useRef, useState } from 'react';

interface CircuitTrackThumbnailProps {
   trackPath: string;
   name?: string;
   className?: string;
}

export const CircuitTrackThumbnail: React.FC<CircuitTrackThumbnailProps> = ({
   trackPath,
   name = 'Circuit track map',
   className = 'w-16 h-16',
}) => {
   const pathRef = useRef<SVGPathElement | null>(null);
   const [viewBox, setViewBox] = useState<string>('0 0 500 500');

   useEffect(() => {
      if (pathRef.current) {
         try {
            const bbox = pathRef.current.getBBox();
            if (bbox.width > 5 && bbox.height > 5) {
               const pad = Math.max(24, Math.max(bbox.width, bbox.height) * 0.1);
               const x = Math.floor(bbox.x - pad);
               const y = Math.floor(bbox.y - pad);
               const w = Math.ceil(bbox.width + pad * 2);
               const h = Math.ceil(bbox.height + pad * 2);
               setViewBox(`${x} ${y} ${w} ${h}`);
            }
         } catch {
         }
      }
   }, [trackPath]);

   return (
      <div
         className={`relative flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.08] p-1.5 overflow-hidden transition-all duration-200 group-hover:border-f1-red/40 group-hover:bg-white/[0.06] ${className}`}
      >
         <svg
            viewBox={viewBox}
            className="w-full h-full object-contain filter drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]"
            role="img"
            aria-label={name}
         >
            <path
               ref={pathRef}
               d={trackPath}
               fill="none"
               stroke="#ffffff"
               strokeWidth="24"
               strokeLinecap="round"
               strokeLinejoin="round"
               className="transition-colors duration-200"
            />
         </svg>
      </div>
   );
};

export default CircuitTrackThumbnail;
