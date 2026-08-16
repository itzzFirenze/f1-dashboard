import { useEffect, useState } from 'react';

interface PitLanePt { x: number; y: number }

const SAMPLES = 40;

export function usePitLanePath(
   pathId: string,
   entryPercent: number,
   exitPercent: number,
   offsetPx: number,
   isReversed: boolean = false
) {
   const [result, setResult] = useState<{ d: string; entryPoint: PitLanePt | null; exitPoint: PitLanePt | null }>(
      { d: '', entryPoint: null, exitPoint: null }
   );

   useEffect(() => {
      const svgPath = document.getElementById(pathId) as SVGPathElement | null;
      if (!svgPath || entryPercent === exitPercent) {
         setResult({ d: '', entryPoint: null, exitPoint: null });
         return;
      }

      const totalLength = svgPath.getTotalLength();
      const track: PitLanePt[] = [];

      if (!isReversed) {
         // Direction of travel is increasing percent
         const forward = exitPercent >= entryPercent ? exitPercent - entryPercent : exitPercent + 100 - entryPercent;
         for (let i = 0; i <= SAMPLES; i++) {
            const pct = (entryPercent + (forward * i) / SAMPLES) % 100;
            const pt = svgPath.getPointAtLength((pct / 100) * totalLength);
            track.push({ x: pt.x, y: pt.y });
         }
      } else {
         // Direction of travel is decreasing percent
         const backward = entryPercent >= exitPercent ? entryPercent - exitPercent : entryPercent + 100 - exitPercent;
         for (let i = 0; i <= SAMPLES; i++) {
            let pct = entryPercent - (backward * i) / SAMPLES;
            if (pct < 0) pct += 100;
            const pt = svgPath.getPointAtLength((pct / 100) * totalLength);
            track.push({ x: pt.x, y: pt.y });
         }
      }

      const offset: PitLanePt[] = track.map((pt, i) => {
         const prev = track[Math.max(0, i - 1)];
         const next = track[Math.min(track.length - 1, i + 1)];
         const dx = next.x - prev.x;
         const dy = next.y - prev.y;
         const len = Math.hypot(dx, dy) || 1;
         const nx = -dy / len;
         const ny = dx / len;
         return { x: pt.x + nx * offsetPx, y: pt.y + ny * offsetPx };
      });

      const d =
         `M ${track[0].x.toFixed(2)} ${track[0].y.toFixed(2)} ` +
         `L ${offset.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ')} ` +
         `L ${track[track.length - 1].x.toFixed(2)} ${track[track.length - 1].y.toFixed(2)}`;

      setResult({ d, entryPoint: track[0], exitPoint: track[track.length - 1] });
   }, [pathId, entryPercent, exitPercent, offsetPx, isReversed]);

   return result;
}