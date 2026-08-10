import { useEffect, useState } from 'react';

/**
 * Returns the real SVG total length of the track path (via getTotalLength()),
 * so that dash-based zone highlights (Active Aero, sectors) line up with
 * point-based markers (corners, detection point, speed trap) which use the
 * same getTotalLength()/getPointAtLength() calculation in usePathPoint.
 *
 * Previously, ActiveAeroZone/SectorPath used the SVG `pathLength="100"`
 * normalization trick for their dasharray math. That relies on the browser's
 * dash-rendering arc-length approximation, which is computed independently
 * from getTotalLength() and can diverge on bezier-heavy paths (hairpins,
 * esses, chicanes) — causing zones to visually drift from where a marker at
 * the same percent would land. Using getTotalLength() everywhere removes
 * that mismatch.
 */
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