import { useEffect, useState } from 'react';

export const usePathPoint = (pathId: string, percent: number) => {
   const [point, setPoint] = useState({ x: 250, y: 250 });

   useEffect(() => {
      const update = () => {
         const path = document.getElementById(pathId) as SVGPathElement | null;
         if (!path) return;
         const length = path.getTotalLength();
         const svgPoint = path.getPointAtLength((Math.min(100, Math.max(0, percent)) / 100) * length);
         setPoint({ x: svgPoint.x, y: svgPoint.y });
      };
      update();
      const frame = window.requestAnimationFrame(update);
      return () => window.cancelAnimationFrame(frame);
   }, [pathId, percent]);

   return point;
};
