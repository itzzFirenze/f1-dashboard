import { useEffect, useState } from 'react';

export const usePathLength = (pathId: string) => {
   const [length, setLength] = useState(0);

   useEffect(() => {
      const update = () => {
         const path = document.getElementById(pathId) as SVGPathElement | null;
         if (!path) return;
         const total = path.getTotalLength();
         if (total > 0) setLength(total);
      };
      update();
      const frame = window.requestAnimationFrame(update);
      return () => window.cancelAnimationFrame(frame);
   }, [pathId]);

   return length;
};