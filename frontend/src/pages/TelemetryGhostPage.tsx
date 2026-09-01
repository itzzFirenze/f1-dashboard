import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
   Gauge, Zap, ArrowLeftRight, Activity, Play, Pause, RotateCcw,
   Timer, CornerDownRight, Info, CheckCircle2, UserCheck, Search,
   Crosshair, Maximize2, Calendar, AlertCircle, Ban
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { useTooltip } from '@nivo/tooltip';
import PageHeroTitle from '../components/ui/PageHeroTitle';
import SeasonSelector from '../components/ui/SeasonSelector';
import DriverSelector from '../components/ui/DriverSelector';
import { circuits } from '../data/circuits';
import { driverService } from '../services/driverService';
import { raceService } from '../services/raceService';
import {
   generateTelemetryComparison,
   TelemetryComparisonResult,
} from '../services/telemetryAnalysisService';
import type { Driver, Race, RaceDetail } from '../types';

// Only Q3 best lap vs Race best lap — no custom
type LapMode = 'Q3' | 'Race';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseLapTime(t?: string | null): number | null {
   if (!t) return null;
   const p = t.split(':');
   if (p.length === 2) return parseFloat(p[0]) * 60 + parseFloat(p[1]);
   const s = parseFloat(t);
   return isNaN(s) ? null : s;
}

/** Interpolate an SVG path position for a given percentage using the DOM with length caching */
function getPathXY(
   pathEl: SVGPathElement | null,
   pct: number,
   cachedLength?: number,
): { x: number; y: number } | null {
   if (!pathEl) return null;
   const len = cachedLength && cachedLength > 0 ? cachedLength : pathEl.getTotalLength();
   const clampedPct = Math.min(Math.max(pct, 0), 100);
   const pt = pathEl.getPointAtLength((clampedPct / 100) * len);
   return { x: pt.x, y: pt.y };
}

// ─── Custom Tooltips ────────────────────────────────────────────────────────

const TooltipRow = ({ color, label, value }: { color?: string; label: string; value: string }) => (
   <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
      <span className="flex items-center gap-1.5 text-white/60">
         {color && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
         {label}
      </span>
      <span className="font-bold text-white">{value}</span>
   </div>
);

// ─── Adaptive Slice Tooltips (Matching Championship Gap Evolution) ──────────

const SpeedSliceTooltip: React.FC<{ slice: any; comparison: TelemetryComparisonResult }> = ({ slice, comparison }) => {
   const xVal = Number(slice.points[0]?.data?.x ?? 0);
   const dp = comparison.points.reduce((prev, curr) =>
      Math.abs(curr.distancePct - xVal) < Math.abs(prev.distancePct - xVal) ? curr : prev
   );

   return (
      <div className="p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md" style={{ background: 'rgba(17, 19, 23, 0.96)', minWidth: 175 }}>
         <div className="text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            Lap distance: {Math.round(dp.distancePct)}%
         </div>
         <TooltipRow
            color={comparison.driverA.displayColor}
            label={`${comparison.driverA.code} Speed`}
            value={`${dp.speedA} km/h`}
         />
         <TooltipRow
            color={comparison.driverB.displayColor}
            label={`${comparison.driverB.code} Speed`}
            value={`${dp.speedB} km/h`}
         />
      </div>
   );
};

const DeltaSliceTooltip: React.FC<{ slice: any; comparison: TelemetryComparisonResult }> = ({ slice, comparison }) => {
   const xVal = Number(slice.points[0]?.data?.x ?? 0);
   const dp = comparison.points.reduce((prev, curr) =>
      Math.abs(curr.distancePct - xVal) < Math.abs(prev.distancePct - xVal) ? curr : prev
   );
   const ahead = dp.deltaTime < 0 ? comparison.driverA.code : comparison.driverB.code;

   return (
      <div className="p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md" style={{ background: 'rgba(17, 19, 23, 0.96)', minWidth: 175 }}>
         <div className="text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            Lap distance: {Math.round(dp.distancePct)}%
         </div>
         <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
            <span className="text-white/60">Time gap</span>
            <span className={`font-bold ${dp.deltaTime < 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
               {dp.deltaTime < 0 ? `${dp.deltaTime.toFixed(3)}s (${ahead} ahead)` : `+${dp.deltaTime.toFixed(3)}s (${ahead} ahead)`}
            </span>
         </div>
      </div>
   );
};

const ChannelSliceTooltip: React.FC<{ slice: any; channel: 'Throttle' | 'Brake'; unit: string; comparison: TelemetryComparisonResult }> = ({ slice, channel, unit, comparison }) => {
   const xVal = Number(slice.points[0]?.data?.x ?? 0);
   const dp = comparison.points.reduce((prev, curr) =>
      Math.abs(curr.distancePct - xVal) < Math.abs(prev.distancePct - xVal) ? curr : prev
   );
   const valA = channel === 'Throttle' ? dp.throttleA : dp.brakeA;
   const valB = channel === 'Throttle' ? dp.throttleB : dp.brakeB;

   return (
      <div className="p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md" style={{ background: 'rgba(17, 19, 23, 0.96)', minWidth: 175 }}>
         <div className="text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            Lap distance: {Math.round(dp.distancePct)}%
         </div>
         <TooltipRow
            color={comparison.driverA.displayColor}
            label={`${comparison.driverA.code} ${channel}`}
            value={`${valA}${unit}`}
         />
         <TooltipRow
            color={comparison.driverB.displayColor}
            label={`${comparison.driverB.code} ${channel}`}
            value={`${valB}${unit}`}
         />
      </div>
   );
};

const createAdaptiveSliceLayer = (renderContent: (slice: any) => React.ReactElement): React.FC<any> => {
   return function AdaptiveSlices({ slices, innerHeight, innerWidth, margin, setCurrentSlice }) {
      const { showTooltipAt, hideTooltip } = useTooltip();

      const positionAndShow = (slice: any, event: React.MouseEvent<SVGRectElement>) => {
         const rect = event.currentTarget.getBoundingClientRect();
         const y = event.clientY - rect.top;
         // Hover on left side -> tooltip on right of pointer; hover on right side -> tooltip on left of pointer
         const anchor = slice.x > innerWidth * 0.5 ? 'left' : 'right';
         showTooltipAt(renderContent(slice), [margin.left + slice.x, margin.top + y], anchor);
      };

      return (
         <g>
            {slices.map((slice: any) => (
               <rect
                  key={slice.id}
                  x={slice.x0}
                  y={0}
                  width={slice.width}
                  height={innerHeight}
                  fill="transparent"
                  onMouseEnter={(e) => { if (setCurrentSlice) setCurrentSlice(slice); positionAndShow(slice, e); }}
                  onMouseMove={(e) => positionAndShow(slice, e)}
                  onMouseLeave={() => { if (setCurrentSlice) setCurrentSlice(null); hideTooltip(); }}
               />
            ))}
         </g>
      );
   };
};

// ─── Nivo shared theme ───────────────────────────────────────────────────────

const nivoTheme = {
   text: { fill: '#9ca3af', fontFamily: 'monospace', fontSize: 10 },
   axis: { ticks: { text: { fill: '#9ca3af' } }, domain: { line: { stroke: 'rgba(255,255,255,0.08)' } } },
   grid: { line: { stroke: 'rgba(255,255,255,0.05)' } },
   crosshair: { line: { stroke: '#E10600', strokeWidth: 1 } },
   tooltip: {
      container: {
         background: '#111317',
         color: '#fff',
         borderRadius: '8px',
         border: '1px solid rgba(255,255,255,0.1)',
         fontSize: '11px',
      },
   },
};

// ─── Component ───────────────────────────────────────────────────────────────

const TelemetryGhostPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [races, setRaces] = useState<Race[]>([]);
   const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
   const [currentRaceDetail, setCurrentRaceDetail] = useState<RaceDetail | null>(null);

   const [lapMode, setLapMode] = useState<LapMode>('Q3');

   const [drivers, setDrivers] = useState<Driver[]>([]);
   // Do NOT auto-select Driver A & Driver B
   const [driverA, setDriverA] = useState<Driver | null>(null);
   const [driverB, setDriverB] = useState<Driver | null>(null);

   // Playback state — progress lives in a ref to avoid React re-renders on every frame
   const progressRef = useRef<number>(0);
   const [displayProgress, setDisplayProgress] = useState<number>(0); // updated at ~10fps for UI text only
   const [isPlaying, setIsPlaying] = useState<boolean>(false);
   const [hasFinished, setHasFinished] = useState<boolean>(false);
   const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
   const [activeTab, setActiveTab] = useState<'telemetry' | 'corners' | 'insights'>('telemetry');
   const [cornerFilter, setCornerFilter] = useState<'ALL' | 'A' | 'B'>('ALL');
   const [cameraMode, setCameraMode] = useState<'focus' | 'full'>('focus');
   const [zoomLevel, setZoomLevel] = useState<number>(3.5);

   // Refs for DOM-direct animation
   const animRef = useRef<number | null>(null);
   const lastTimeRef = useRef<number | null>(null);
   const uiUpdateAccRef = useRef<number>(0);
   const pathTotalLengthRef = useRef<number>(0);
   const cameraModeRef = useRef<'focus' | 'full'>('focus');
   const zoomLevelRef = useRef<number>(3.5);

   // SVG refs for ghost cars and dynamic camera
   const ghostARef = useRef<SVGGElement | null>(null);
   const ghostBRef = useRef<SVGGElement | null>(null);
   const svgPathRef = useRef<SVGPathElement | null>(null);
   const svgElRef = useRef<SVGSVGElement | null>(null);
   const scrubberRef = useRef<HTMLInputElement | null>(null);

   // ── Data loading ──────────────────────────────────────────────────────────

   useEffect(() => {
      Promise.all([
         driverService.getAll(undefined, season),
         raceService.getAll(season),
      ])
         .then(([dList, rList]) => {
            setDrivers(dList);
            setRaces(rList);
            // Default to most recent completed race if possible
            const completed = rList.filter((r) => r.status === 'COMPLETED');
            const defaultRace = completed[completed.length - 1] ?? rList[0];
            if (defaultRace) setSelectedRaceId(defaultRace.id);
         })
         .catch(console.error);
   }, [season]);

   useEffect(() => {
      if (selectedRaceId) {
         setCurrentRaceDetail(null);
         raceService.getById(selectedRaceId).then(setCurrentRaceDetail).catch(console.error);
      }
   }, [selectedRaceId]);

   // ── Derived data ──────────────────────────────────────────────────────────

   const activeRace = useMemo(
      () => races.find((r) => r.id === selectedRaceId) ?? null,
      [races, selectedRaceId],
   );

   const currentCircuit = useMemo(() => {
      if (!activeRace) return circuits[0];
      const loc = (activeRace.location || activeRace.country || '').toLowerCase();
      return (
         circuits.find(
            (c) =>
               c.location.toLowerCase().includes(loc) ||
               c.country.toLowerCase().includes(loc) ||
               loc.includes(c.location.toLowerCase()) ||
               loc.includes(c.id.toLowerCase()),
         ) ?? circuits[0]
      );
   }, [activeRace]);

   const isTeammates = useMemo(
      () =>
         !!driverA &&
         !!driverB &&
         driverA.constructorName?.toLowerCase() === driverB.constructorName?.toLowerCase(),
      [driverA, driverB],
   );

   const isCancelled = activeRace?.status === 'CANCELLED';
   const isCompletedSession = useMemo(() => {
      if (!activeRace || activeRace.status !== 'COMPLETED' || isCancelled) return false;
      if (!currentRaceDetail) return false;
      if (lapMode === 'Q3') {
         return Boolean(currentRaceDetail.qualifyingResults && currentRaceDetail.qualifyingResults.length > 0);
      }
      return Boolean(currentRaceDetail.results && currentRaceDetail.results.length > 0);
   }, [activeRace, currentRaceDetail, lapMode, isCancelled]);

   // Driver A result — qualifying or race depending on mode
   const driverAResult = useMemo(() => {
      if (!currentRaceDetail || !driverA) return null;
      return lapMode === 'Q3'
         ? currentRaceDetail.qualifyingResults?.find((r) => r.driverCode === driverA.code) ?? null
         : currentRaceDetail.results?.find((r) => r.driverCode === driverA.code) ?? null;
   }, [currentRaceDetail, driverA, lapMode]);

   const driverBResult = useMemo(() => {
      if (!currentRaceDetail || !driverB) return null;
      return lapMode === 'Q3'
         ? currentRaceDetail.qualifyingResults?.find((r) => r.driverCode === driverB.code) ?? null
         : currentRaceDetail.results?.find((r) => r.driverCode === driverB.code) ?? null;
   }, [currentRaceDetail, driverB, lapMode]);

   // Real lap time strings for display and offset calculation
   const lapTimeStrA = useMemo(() => {
      if (!driverAResult) return null;
      if (lapMode === 'Q3') return driverAResult.q3 ?? driverAResult.q2 ?? driverAResult.q1;
      return driverAResult.fastestLap ? currentCircuit.lapRecord : null;
   }, [driverAResult, lapMode, currentCircuit]);

   const lapTimeStrB = useMemo(() => {
      if (!driverBResult) return null;
      if (lapMode === 'Q3') return driverBResult.q3 ?? driverBResult.q2 ?? driverBResult.q1;
      return driverBResult.fastestLap ? currentCircuit.lapRecord : null;
   }, [driverBResult, lapMode, currentCircuit]);

   // ── Comparison object ─────────────────────────────────────────────────────

   const comparison: TelemetryComparisonResult | null = useMemo(() => {
      if (!isCompletedSession || !driverA || !driverB) return null;

      const secA = parseLapTime(lapTimeStrA) ?? null;
      const secB = parseLapTime(lapTimeStrB) ?? null;

      let offsetA = 0;
      let offsetB = 0;

      if (secA !== null && secB !== null) {
         const faster = Math.min(secA, secB);
         offsetA = secA - faster;
         offsetB = secB - faster;
      } else if (lapMode === 'Q3') {
         const posA = driverAResult?.position ?? 1;
         const posB = driverBResult?.position ?? 2;
         offsetA = Math.max(0, (posA - 1) * 0.05);
         offsetB = Math.max(0, (posB - 1) * 0.05);
      } else {
         const posA = driverAResult?.position ?? 1;
         const posB = driverBResult?.position ?? 2;
         offsetA = Math.max(0, (posA - 1) * 0.05);
         offsetB = Math.max(0, (posB - 1) * 0.05);
      }

      return generateTelemetryComparison(
         currentCircuit.id,
         {
            code: driverA.code,
            name: `${driverA.firstName} ${driverA.lastName}`,
            team: driverA.constructorName,
            color: driverA.constructorColor || '#E10600',
            lapOffsetSec: offsetA,
            styleVariance: 0.07,
            lapNumber: lapMode === 'Q3' ? (driverAResult?.position ?? 1) : 1,
            compound: lapMode === 'Q3' ? 'SOFT' : 'MEDIUM',
         },
         {
            code: driverB.code,
            name: `${driverB.firstName} ${driverB.lastName}`,
            team: driverB.constructorName,
            color: driverB.constructorColor || '#38BDF8',
            lapOffsetSec: offsetB,
            styleVariance: -0.05,
            lapNumber: lapMode === 'Q3' ? (driverBResult?.position ?? 2) : 1,
            compound: lapMode === 'Q3' ? 'SOFT' : 'MEDIUM',
         },
      );
   }, [
      isCompletedSession, currentCircuit, driverA, driverB, driverAResult, driverBResult,
      lapMode, lapTimeStrA, lapTimeStrB,
   ]);

   // Sparse chart data — only 50 points with numeric x for clean x-axis
   const { speedLineData, deltaLineData, throttleLineData, brakeLineData } = useMemo(() => {
      if (!comparison) return { speedLineData: [], deltaLineData: [], throttleLineData: [], brakeLineData: [] };

      const pts = comparison.points;
      const step = Math.max(1, Math.floor(pts.length / 50));
      const sparse = pts.filter((_, i) => i % step === 0);

      const toX = (p: typeof pts[0]) => Math.round(p.distancePct);

      return {
         speedLineData: [
            { id: comparison.driverA.code, data: sparse.map((p) => ({ x: toX(p), y: p.speedA })) },
            { id: comparison.driverB.code, data: sparse.map((p) => ({ x: toX(p), y: p.speedB })) },
         ],
         deltaLineData: [
            { id: 'Gap (s)', data: sparse.map((p) => ({ x: toX(p), y: p.deltaTime })) },
         ],
         throttleLineData: [
            { id: `${comparison.driverA.code} Throttle`, data: sparse.map((p) => ({ x: toX(p), y: p.throttleA })) },
            { id: `${comparison.driverB.code} Throttle`, data: sparse.map((p) => ({ x: toX(p), y: p.throttleB })) },
         ],
         brakeLineData: [
            { id: `${comparison.driverA.code} Brake`, data: sparse.map((p) => ({ x: toX(p), y: p.brakeA })) },
            { id: `${comparison.driverB.code} Brake`, data: sparse.map((p) => ({ x: toX(p), y: p.brakeB })) },
         ],
      };
   }, [comparison]);

   const filteredCorners = useMemo(() => {
      if (!comparison) return [];
      if (cornerFilter === 'ALL') return comparison.corners;
      return comparison.corners.filter((c) => c.fasterDriver === cornerFilter);
   }, [comparison, cornerFilter]);

   // Measure and cache path total length whenever circuit changes
   useEffect(() => {
      if (svgPathRef.current) {
         try {
            pathTotalLengthRef.current = svgPathRef.current.getTotalLength();
         } catch {
            pathTotalLengthRef.current = 0;
         }
      }
   }, [currentCircuit]);

   // ── Ghost car position lookup (Continuous smooth LERP interpolation) ────────

   const getGhostPositions = useCallback(
      (pct: number) => {
         if (!comparison || !svgPathRef.current) return null;
         const pts = comparison.points;
         if (!pts || pts.length === 0) return null;

         if (pathTotalLengthRef.current <= 0) {
            try {
               pathTotalLengthRef.current = svgPathRef.current.getTotalLength();
            } catch {
               pathTotalLengthRef.current = 0;
            }
         }
         const len = pathTotalLengthRef.current;

         // Continuous sub-index linear interpolation (LERP) across telemetry samples
         const clampedPct = Math.min(Math.max(pct, 0), 100);
         const exactIdx = (clampedPct / 100) * (pts.length - 1);
         const i0 = Math.floor(exactIdx);
         const i1 = Math.min(i0 + 1, pts.length - 1);
         const frac = exactIdx - i0;

         const pA0 = pts[i0].positionPctA;
         const pA1 = pts[i1].positionPctA;
         const smoothPctA = pA0 + (pA1 - pA0) * frac;

         const pB0 = pts[i0].positionPctB;
         const pB1 = pts[i1].positionPctB;
         const smoothPctB = pB0 + (pB1 - pB0) * frac;

         const posA = getPathXY(svgPathRef.current, smoothPctA, len);
         const posB = getPathXY(svgPathRef.current, smoothPctB, len);
         return { posA, posB, pt: pts[i0] };
      },
      [comparison],
   );

   // ── DOM-direct animation loop — no React state per frame ─────────────────

   const applyFrame = useCallback(
      (pct: number) => {
         if (ghostARef.current && ghostBRef.current && svgPathRef.current) {
            const res = getGhostPositions(pct);
            if (res) {
               const { posA, posB } = res;
               if (posA) ghostARef.current.setAttribute('transform', `translate(${posA.x} ${posA.y})`);
               if (posB) ghostBRef.current.setAttribute('transform', `translate(${posB.x} ${posB.y})`);

               // Dynamic Camera ViewBox: smoothly focus and track the ghost cars on circuit
               if (svgElRef.current) {
                  if (cameraModeRef.current === 'focus' && posA && posB) {
                     const defBox = (currentCircuit.viewBox ?? '0 0 500 500').split(' ').map(Number);
                     const defW = defBox[2] || 500;
                     const defH = defBox[3] || 500;
                     const zoom = zoomLevelRef.current || 3.5;
                     const boxW = defW / zoom;
                     const boxH = defH / zoom;
                     const cx = (posA.x + posB.x) / 2;
                     const cy = (posA.y + posB.y) / 2;
                     svgElRef.current.setAttribute('viewBox', `${(cx - boxW / 2).toFixed(1)} ${(cy - boxH / 2).toFixed(1)} ${boxW.toFixed(1)} ${boxH.toFixed(1)}`);
                  } else {
                     svgElRef.current.setAttribute('viewBox', currentCircuit.viewBox ?? '0 0 500 500');
                  }
               }
            }
         }
         if (scrubberRef.current) {
            scrubberRef.current.value = String(pct);
            scrubberRef.current.style.background = `linear-gradient(to right, #E10600 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
         }
      },
      [getGhostPositions, currentCircuit],
   );

   const rafLoop = useCallback(
      (time: number) => {
         if (lastTimeRef.current === null) {
            lastTimeRef.current = time;
         }
         // Cap max delta time to 0.1s to avoid jumps on tab switch
         const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
         lastTimeRef.current = time;

         const lapSec = comparison?.driverA.lapTimeSeconds ?? 85;
         const stepPct = (delta / lapSec) * 100 * playbackSpeed;
         const next = progressRef.current + stepPct;

         if (next >= 100) {
            progressRef.current = 100;
            applyFrame(100);
            setDisplayProgress(100);
            setIsPlaying(false);
            setHasFinished(true);
            return;
         }

         progressRef.current = next;
         applyFrame(next);

         uiUpdateAccRef.current += delta;
         if (uiUpdateAccRef.current >= 0.05) {
            uiUpdateAccRef.current = 0;
            setDisplayProgress(next);
         }

         animRef.current = requestAnimationFrame(rafLoop);
      },
      [comparison, playbackSpeed, applyFrame],
   );

   useEffect(() => {
      if (isPlaying) {
         lastTimeRef.current = null;
         animRef.current = requestAnimationFrame(rafLoop);
      } else {
         if (animRef.current) cancelAnimationFrame(animRef.current);
         animRef.current = null;
      }
      return () => {
         if (animRef.current) cancelAnimationFrame(animRef.current);
      };
   }, [isPlaying, rafLoop]);

   useEffect(() => {
      if (comparison) {
         progressRef.current = 0;
         setDisplayProgress(0);
         setIsPlaying(false);
         setHasFinished(false);
         setTimeout(() => applyFrame(0), 100);
      }
   }, [comparison, applyFrame]);

   // ── Playback controls ─────────────────────────────────────────────────────

   const togglePlay = () => {
      if (hasFinished) {
         progressRef.current = 0;
         setDisplayProgress(0);
         setHasFinished(false);
         setIsPlaying(true);
      } else {
         setIsPlaying((p) => !p);
      }
   };

   const resetPlay = () => {
      setIsPlaying(false);
      setHasFinished(false);
      progressRef.current = 0;
      setDisplayProgress(0);
      applyFrame(0);
   };

   const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsPlaying(false);
      const val = parseFloat(e.target.value);
      progressRef.current = val;
      setDisplayProgress(val);
      applyFrame(val);
   };

   const swapDrivers = () => {
      setDriverA(driverB);
      setDriverB(driverA);
   };

   const setCameraModeAndApply = (mode: 'focus' | 'full') => {
      setCameraMode(mode);
      cameraModeRef.current = mode;
      applyFrame(progressRef.current);
   };

   const setZoomLevelAndApply = (zoom: number) => {
      setZoomLevel(zoom);
      zoomLevelRef.current = zoom;
      applyFrame(progressRef.current);
   };

   // ── Misc computed ─────────────────────────────────────────────────────────

   const modeLabel = lapMode === 'Q3' ? 'Q3 Best Lap' : 'Race Best Lap';
   const resultLabelA = lapMode === 'Q3'
      ? (driverAResult?.q3 ?? driverAResult?.q2 ?? driverAResult?.q1 ?? comparison?.driverA.lapTime ?? '—')
      : (lapTimeStrA ?? comparison?.driverA.lapTime ?? '—');
   const resultLabelB = lapMode === 'Q3'
      ? (driverBResult?.q3 ?? driverBResult?.q2 ?? driverBResult?.q1 ?? comparison?.driverB.lapTime ?? '—')
      : (lapTimeStrB ?? comparison?.driverB.lapTime ?? '—');

   // Drivers available for B (excluding driverA if selected)
   const driversForB = useMemo(() => drivers.filter((d) => !driverA || d.id !== driverA.id), [drivers, driverA]);
   // Drivers available for A (excluding driverB if selected)
   const driversForA = useMemo(() => drivers.filter((d) => !driverB || d.id !== driverB.id), [drivers, driverB]);

   // ── Render ────────────────────────────────────────────────────────────────

   return (
      <div className="space-y-7 animate-fade-in">

         {/* ─── Hero ─── */}
         <div className="relative overflow-visible rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25">
                        <Gauge className="w-3.5 h-3.5 text-f1-red-light" />
                        <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">Telemetry Studio</span>
                     </div>
                  </div>

                  <PageHeroTitle icon={Activity} titlePrefix="Lap Ghost" titleAccent="Head-to-Head Telemetry" />
                  <p className="text-f1-silver text-sm max-w-2xl leading-relaxed">
                     Select two drivers to compare qualifying or race best laps with animated ghost cars on track, live telemetry traces, and sector-by-sector time deltas.
                  </p>
               </div>

               {/* Controls row */}
               <div className="flex flex-wrap items-center gap-3">
                  {/* Race selector */}
                  <select
                     value={selectedRaceId ?? ''}
                     onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                     className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-mono text-f1-white focus:outline-none focus:border-f1-red/50 cursor-pointer max-w-xs"
                  >
                     {races.map((r) => (
                        <option key={r.id} value={r.id} className="bg-f1-black">
                           R{r.round}: {r.name} ({r.country}) {r.status === 'COMPLETED' ? '✓' : ''}
                        </option>
                     ))}
                  </select>

                  {/* Mode toggle — only Q3 or Race */}
                  <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
                     {(['Q3', 'Race'] as const).map((mode) => (
                        <button
                           key={mode}
                           onClick={() => setLapMode(mode)}
                           className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${lapMode === mode ? 'bg-f1-red text-white' : 'text-f1-silver/70 hover:text-white'
                              }`}
                        >
                           {mode === 'Q3' ? 'Q3 Best Lap' : 'Race Best Lap'}
                        </button>
                     ))}
                  </div>

                  <SeasonSelector selectedSeason={season} onSelectSeason={(yr) => setSeason(yr ?? 2026)} label="Season" />
               </div>
            </div>
         </div>

         {/* ─── Session Content: Only display Telemetry Studio when Session has Real Data ─── */}
         {!isCompletedSession ? (
            <div className="telemetry-card p-10 sm:p-14 text-center relative overflow-hidden rounded-3xl border border-white/[0.08] dot-grid animate-fade-in">
               <div className="scanline-overlay" />
               <div className="max-w-lg mx-auto space-y-5 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl ${isCancelled
                     ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                     : season >= 2026
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        : 'bg-white/[0.06] border border-white/10 text-f1-silver'
                     }`}>
                     {isCancelled ? (
                        <Ban className="w-8 h-8" />
                     ) : season >= 2026 ? (
                        <Calendar className="w-8 h-8" />
                     ) : (
                        <AlertCircle className="w-8 h-8" />
                     )}
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-xl sm:text-2xl font-display font-bold text-f1-white">
                        {isCancelled
                           ? 'Race Cancelled'
                           : season >= 2026
                              ? 'Race Has Not Been Conducted Yet'
                              : 'No Data Available or Race Cancelled'}
                     </h3>
                     <p className="text-sm font-mono text-f1-silver/70 leading-relaxed max-w-md mx-auto">
                        {isCancelled
                           ? `The ${season} ${activeRace?.name || 'Grand Prix'} was officially cancelled. No qualifying, race, or telemetry records exist.`
                           : season >= 2026
                              ? `The ${activeRace?.name || 'Grand Prix'} for the ${season} season has not been conducted yet. Official recorded telemetry will become available once the race weekend concludes.`
                              : `No telemetry or session timing data is available for the ${season} ${activeRace?.name || 'Grand Prix'}, or the race was cancelled.`}
                     </p>
                  </div>

                  {activeRace && (
                     <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-f1-silver/60">
                        <span>Round {activeRace.round}</span>
                        <span>•</span>
                        <span>{activeRace.circuitName || activeRace.location}</span>
                        {activeRace.raceDate && (
                           <>
                              <span>•</span>
                              <span>{activeRace.raceDate}</span>
                           </>
                        )}
                     </div>
                  )}
               </div>
            </div>
         ) : (
            <>
               {/* ─── Driver Selectors ─── */}
               <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end relative z-30">
                  <DriverSelector
                     drivers={driversForA}
                     selected={driverA}
                     onSelect={setDriverA}
                     label="Car A"
                     accentColor={driverA?.constructorColor || '#E10600'}
                  />
                  <button
                     onClick={swapDrivers}
                     disabled={!driverA || !driverB}
                     className={`hidden md:flex w-12 h-12 rounded-xl border items-center justify-center transition-all self-end mb-1 group ${driverA && driverB
                        ? 'bg-white/[0.03] border-white/[0.06] hover:bg-f1-red/10 hover:border-f1-red/30 cursor-pointer text-f1-silver/70 hover:text-white'
                        : 'bg-white/[0.01] border-white/[0.04] text-white/20 cursor-not-allowed'
                        }`}
                     title="Swap drivers"
                  >
                     <ArrowLeftRight className={`w-5 h-5 transition-colors ${driverA && driverB ? 'text-f1-silver/60 group-hover:text-f1-red-light' : 'text-white/20'
                        }`} />
                  </button>
                  <DriverSelector
                     drivers={driversForB}
                     selected={driverB}
                     onSelect={setDriverB}
                     label={`Car B`}
                     accentColor={(isTeammates ? comparison?.driverB.displayColor : driverB?.constructorColor) || '#38BDF8'}
                  />
               </div>

               {/* ─── Lap Matchup Header Cards (Visible when Drivers are Selected) ─── */}
               {comparison && driverA && driverB && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-fade-in">
                     {/* ── Driver A Card ── */}
                     <div
                        className="lg:col-span-5 telemetry-card p-5 flex flex-col justify-between border-l-4 transition-all"
                        style={{ borderLeftColor: driverA.constructorColor || '#4B5563' }}
                     >
                        <div>
                           <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                              <div className="flex items-center gap-2">
                                 <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: driverA.constructorColor || '#4B5563' }}
                                 />
                                 <span className="text-xs font-mono font-bold text-f1-silver/60 uppercase">
                                    Car A — Solid Line
                                 </span>
                              </div>
                              {lapMode === 'Q3' && driverAResult?.position && (
                                 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.05] text-amber-400">
                                    Quali P{driverAResult.position}
                                 </span>
                              )}
                              {lapMode === 'Race' && driverAResult?.position && (
                                 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.05] text-sky-400">
                                    Race P{driverAResult.position}
                                 </span>
                              )}
                           </div>

                           <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2.5">
                                    <div
                                       className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-white text-xs shrink-0 shadow-md"
                                       style={{ backgroundColor: driverA.constructorColor }}
                                    >
                                       {driverA.code}
                                    </div>
                                    <div className="truncate">
                                       <p className="font-display font-bold text-f1-white text-base truncate">
                                          {driverA.firstName} {driverA.lastName}
                                       </p>
                                       <p className="text-xs font-mono truncate" style={{ color: driverA.constructorColor }}>
                                          {driverA.constructorName}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-2xl font-display font-black text-amber-400 block">{resultLabelA}</span>
                                 <span className="text-[10px] font-mono text-f1-silver/50 uppercase">
                                    Top: {comparison.driverA.topSpeedKmh || 320} km/h
                                 </span>
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06] text-center text-xs font-mono">
                              {['s1Time', 's2Time', 's3Time'].map((k, i) => (
                                 <div key={k} className="p-1.5 rounded-lg bg-white/[0.02]">
                                    <span className="text-[9px] text-f1-silver/50 block">S{i + 1}</span>
                                    <span className="font-bold text-f1-white">{(comparison.driverA as any)[k]}s</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* ── Centre Swap & Gap Card ── */}
                     <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                        <div className="text-center">
                           <span className="text-[9px] font-mono text-f1-silver/50 uppercase block">Mode</span>
                           <span className="text-[11px] font-mono font-black text-f1-white">{modeLabel}</span>
                        </div>
                        <button
                           onClick={swapDrivers}
                           className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-f1-red/10 hover:border-f1-red/30 text-f1-silver hover:text-white transition-all cursor-pointer"
                           title="Swap Drivers"
                        >
                           <ArrowLeftRight className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                           <span className="text-[9px] font-mono text-f1-silver/50 uppercase block">Delta</span>
                           <span className={`text-sm font-mono font-black ${comparison.summary.fasterDriver === 'A' ? 'text-emerald-400' : 'text-sky-400'}`}>
                              {comparison.summary.timeGapSeconds === 0 ? 'TIE' : `+${comparison.summary.timeGapSeconds}s`}
                           </span>
                           <span className="text-[9px] font-mono text-f1-silver/40 block mt-0.5">
                              Faster: {comparison.summary.fasterDriver === 'A' ? comparison.driverA.code : comparison.driverB.code}
                           </span>
                        </div>
                     </div>

                     {/* ── Driver B Card ── */}
                     <div
                        className={`lg:col-span-5 telemetry-card p-5 flex flex-col justify-between border-l-4 transition-all ${comparison.driverB.lineStyle === 'dashed' ? 'border-dashed' : ''
                           }`}
                        style={{ borderLeftColor: comparison.driverB.displayColor || driverB.constructorColor || '#4B5563' }}
                     >
                        <div>
                           <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                              <div className="flex items-center gap-2">
                                 <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: comparison.driverB.displayColor || driverB.constructorColor || '#4B5563' }}
                                 />
                                 <span className="text-xs font-mono font-bold text-f1-silver/60 uppercase">
                                    Car B — {comparison.driverB.lineStyle === 'dashed' ? 'Dashed Line' : 'Solid Line'}
                                 </span>

                              </div>
                              {lapMode === 'Q3' && driverBResult?.position && (
                                 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.05] text-amber-400">
                                    Quali P{driverBResult.position}
                                 </span>
                              )}
                              {lapMode === 'Race' && driverBResult?.position && (
                                 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.05] text-sky-400">
                                    Race P{driverBResult.position}
                                 </span>
                              )}
                           </div>

                           <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2.5">
                                    <div
                                       className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-white text-xs shrink-0 shadow-md"
                                       style={{ backgroundColor: comparison.driverB.displayColor || driverB.constructorColor }}
                                    >
                                       {driverB.code}
                                    </div>
                                    <div className="truncate">
                                       <p className="font-display font-bold text-f1-white text-base truncate">
                                          {driverB.firstName} {driverB.lastName}
                                       </p>
                                       <p className="text-xs font-mono truncate" style={{ color: comparison.driverB.displayColor || driverB.constructorColor }}>
                                          {driverB.constructorName}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-2xl font-display font-black text-amber-400 block">{resultLabelB}</span>
                                 <span className="text-[10px] font-mono text-f1-silver/50 uppercase">
                                    Top: {comparison.driverB.topSpeedKmh || 320} km/h
                                 </span>
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06] text-center text-xs font-mono">
                              {['s1Time', 's2Time', 's3Time'].map((k, i) => (
                                 <div key={k} className="p-1.5 rounded-lg bg-white/[0.02]">
                                    <span className="text-[9px] text-f1-silver/50 block">S{i + 1}</span>
                                    <span className="font-bold text-f1-white">{(comparison.driverB as any)[k]}s</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* ─── Empty State when Drivers are not both selected ─── */}
               {(!driverA || !driverB) && (
                  <div className="telemetry-card p-12 text-center relative overflow-visible rounded-3xl border border-white/[0.08]">
                     <div className="max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-f1-red/10 border border-f1-red/25 flex items-center justify-center mx-auto text-f1-red-light">
                           <UserCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-f1-white">
                           Select Two Drivers to Begin
                        </h3>
                        <p className="text-sm font-mono text-f1-silver/70 leading-relaxed">
                           Choose <strong className="text-white">Driver A</strong> and <strong className="text-white">Driver B</strong> using the selector inputs above to compare qualifying or race telemetry on the ghost track and synchronized telemetry traces.
                        </p>
                     </div>
                  </div>
               )}

               {/* ─── Tab Bar & Content (When Comparison is Ready) ─── */}
               {comparison && (
                  <>
                     <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 flex-wrap">
                        {(
                           [
                              { id: 'telemetry', label: 'Ghost Map & Telemetry Traces', icon: Activity },
                              { id: 'insights', label: 'Sector Engineering Insights', icon: Info },
                              { id: 'corners', label: `Corner Apex Matrix (${comparison.corners.length})`, icon: CornerDownRight },
                           ] as const
                        ).map(({ id, label, icon: Icon }) => (
                           <button
                              key={id}
                              onClick={() => setActiveTab(id)}
                              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === id
                                 ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                                 : 'text-f1-silver/70 hover:text-white hover:bg-white/[0.04]'
                                 }`}
                           >
                              <Icon className="w-4 h-4" />
                              {label}
                           </button>
                        ))}
                     </div>

                     {/* ─── Telemetry Tab ─── */}
                     {activeTab === 'telemetry' && (
                        <div className="space-y-6">

                           {/* ── Ghost Map + Playback ── */}
                           <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                              {/* Track Mini-Map with Driver Focus / Full Circuit Camera */}
                              <div className="lg:col-span-6 telemetry-card p-5 flex flex-col justify-between">
                                 <div>
                                    <div className="mb-3 pb-2 border-b border-white/[0.06]">
                                       {/* Row 1: Title */}
                                       <div className="flex items-center gap-2 mb-2.5">
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                          <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                                             Ghost Track — {currentCircuit.name}
                                          </h3>
                                       </div>

                                       {/* Row 2: Camera Mode & Zoom Controls — always on their own line */}
                                       <div className="flex items-center gap-2 flex-wrap">
                                          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
                                             <button
                                                onClick={() => setCameraModeAndApply('focus')}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${cameraMode === 'focus' ? 'bg-f1-red text-white shadow-md shadow-f1-red/20' : 'text-f1-silver/70 hover:text-white'
                                                   }`}
                                                title="Focus camera closely on the cars"
                                             >
                                                <Crosshair className="w-3 h-3" />
                                                <span>Driver Focus</span>
                                             </button>
                                             <button
                                                onClick={() => setCameraModeAndApply('full')}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${cameraMode === 'full' ? 'bg-f1-red text-white shadow-md shadow-f1-red/20' : 'text-f1-silver/70 hover:text-white'
                                                   }`}
                                                title="View entire circuit"
                                             >
                                                <Maximize2 className="w-3 h-3" />
                                                <span>Full Track</span>
                                             </button>
                                          </div>

                                          {/* Zoom pills — always mounted, just faded out when not in focus mode */}
                                          <div
                                             className={`flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 transition-opacity ${cameraMode === 'focus' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                                }`}
                                          >
                                             {([
                                                { val: 2.2, label: '2x' },
                                                { val: 3.5, label: '3.5x' },
                                                { val: 5.0, label: '5x' },
                                             ] as const).map(({ val, label }) => (
                                                <button
                                                   key={val}
                                                   onClick={() => setZoomLevelAndApply(val)}
                                                   className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${zoomLevel === val ? 'bg-white/[0.15] text-white' : 'text-f1-silver/50 hover:text-white'
                                                      }`}
                                                >
                                                   {label}
                                                </button>
                                             ))}
                                          </div>
                                       </div>
                                    </div>

                                    <div className="relative w-full min-h-[250px] flex items-center justify-center rounded-2xl bg-black/25 overflow-hidden border border-white/[0.04] dot-grid">
                                       {/* Dynamic HUD Badge */}
                                       <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2 pointer-events-none">
                                          {cameraMode === 'focus' ? (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-f1-red/30 text-f1-red-light text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg">
                                                <Crosshair className="w-3 h-3 text-f1-red-light animate-pulse" /> Chase Cam ({zoomLevel}x)
                                             </span>
                                          ) : (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-wider shadow-lg">
                                                <Maximize2 className="w-3 h-3" /> Full Overview
                                             </span>
                                          )}
                                       </div>

                                       <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                                          <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-f1-silver/70">
                                             {displayProgress.toFixed(1)}% Lap
                                          </span>
                                       </div>

                                       <svg
                                          ref={svgElRef}
                                          viewBox={currentCircuit.viewBox ?? '0 0 500 500'}
                                          className="w-full h-full transition-[viewBox] duration-75"
                                          style={{ maxHeight: 280 }}
                                       >
                                          {/* Track base */}
                                          <path
                                             d={currentCircuit.trackPath}
                                             fill="none"
                                             stroke="#1e2330"
                                             strokeWidth="28"
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                          />
                                          {/* Track surface */}
                                          <path
                                             ref={svgPathRef}
                                             id={`ghost-track-${currentCircuit.id}`}
                                             d={currentCircuit.trackPath}
                                             fill="none"
                                             stroke="#3d4559"
                                             strokeWidth="10"
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                          />

                                          {/* Ghost A */}
                                          <g ref={ghostARef} transform="translate(0 0)">
                                             <circle r="15" fill={comparison.driverA.displayColor} fillOpacity="0.2" className="animate-pulse" />
                                             <circle r="10" fill={comparison.driverA.displayColor} stroke="#fff" strokeWidth="2" />
                                             <text y="3.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff" fontFamily="monospace">
                                                {comparison.driverA.code}
                                             </text>
                                          </g>

                                          {/* Ghost B */}
                                          <g ref={ghostBRef} transform="translate(0 0)">
                                             <circle r="10" fill={comparison.driverB.displayColor} stroke="#fff" strokeWidth="2"
                                                strokeDasharray={comparison.driverB.lineStyle === 'dashed' ? '3 2' : undefined} />
                                             <text y="3.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff" fontFamily="monospace">
                                                {comparison.driverB.code}
                                             </text>
                                          </g>
                                       </svg>
                                    </div>
                                 </div>

                                 {/* Legend */}
                                 <div className="flex items-center justify-center gap-6 pt-3 border-t border-white/[0.06] text-xs font-mono mt-3">
                                    <span className="flex items-center gap-2">
                                       <span className="w-3 h-1.5 rounded" style={{ backgroundColor: comparison.driverA.displayColor }} />
                                       <strong className="text-f1-white">{comparison.driverA.code}</strong>
                                    </span>
                                    <span className="flex items-center gap-2">
                                       <span className="w-3 h-1.5 rounded" style={{ backgroundColor: comparison.driverB.displayColor, opacity: comparison.driverB.lineStyle === 'dashed' ? 0.7 : 1 }} />
                                       <strong className="text-f1-white">{comparison.driverB.code}</strong>
                                       {comparison.driverB.lineStyle === 'dashed' && <span className="text-f1-silver/50">(Dashed)</span>}
                                    </span>
                                 </div>
                              </div>

                              {/* Playback Controls */}
                              <div className="lg:col-span-6 telemetry-card p-5 flex flex-col justify-between">
                                 <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                                       <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                                          Lap Replay — {lapMode === 'Q3' ? 'Q3 Best Lap' : 'Race Best Lap'}
                                       </h3>
                                       <div className="flex items-center gap-1">
                                          {([0.5, 1, 2, 4] as const).map((spd) => (
                                             <button
                                                key={spd}
                                                onClick={() => setPlaybackSpeed(spd)}
                                                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${playbackSpeed === spd ? 'bg-f1-red text-white' : 'bg-white/[0.04] text-f1-silver/70 hover:text-white'
                                                   }`}
                                             >
                                                {spd}x
                                             </button>
                                          ))}
                                       </div>
                                    </div>

                                    {/* Scrubber */}
                                    <div className="space-y-2 mb-5">
                                       <div className="flex justify-between text-xs font-mono text-f1-silver/60">
                                          <span>Lap Progress</span>
                                          <span className="font-bold text-f1-white">{displayProgress.toFixed(1)}%</span>
                                       </div>
                                       <input
                                          ref={scrubberRef}
                                          type="range"
                                          min="0"
                                          max="100"
                                          step="0.5"
                                          defaultValue="0"
                                          onChange={handleScrub}
                                          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-f1-red"
                                          style={{ background: `linear-gradient(to right, #E10600 ${displayProgress}%, rgba(255,255,255,0.1) ${displayProgress}%)` }}
                                       />
                                       <div className="flex justify-between text-[10px] font-mono text-f1-silver/40">
                                          <span>Start</span>
                                          <span>Finish Line</span>
                                       </div>
                                    </div>

                                    {/* Play / Pause / Reset */}
                                    <div className="flex gap-3">
                                       <button
                                          onClick={togglePlay}
                                          className={`flex-1 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isPlaying
                                             ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                             : hasFinished
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-f1-red text-white shadow-lg shadow-f1-red/20 hover:bg-f1-red/80'
                                             }`}
                                       >
                                          {isPlaying ? (
                                             <><Pause className="w-4 h-4" /> Pause Replay</>
                                          ) : hasFinished ? (
                                             <><RotateCcw className="w-4 h-4" /> Replay Lap</>
                                          ) : (
                                             <><Play className="w-4 h-4 fill-current" /> Play Ghost Lap</>
                                          )}
                                       </button>
                                       <button
                                          onClick={resetPlay}
                                          title="Reset to Start"
                                          className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-f1-silver hover:text-white transition-all cursor-pointer"
                                       >
                                          <RotateCcw className="w-4 h-4" />
                                       </button>
                                    </div>

                                    {hasFinished && (
                                       <p className="mt-3 text-center text-xs font-mono text-emerald-400">
                                          🏁 Lap complete — {comparison.summary.fasterDriver === 'A' ? comparison.driverA.code : comparison.driverB.code} wins by +{comparison.summary.timeGapSeconds}s
                                       </p>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* ── Speed Trace ── */}
                           <div className="telemetry-card p-5">
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-f1-red" />
                                    <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">Speed (km/h) vs Lap Distance %</h3>
                                 </div>
                                 <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className="flex items-center gap-1.5">
                                       <span className="w-4 h-0.5 rounded" style={{ backgroundColor: comparison.driverA.displayColor }} />
                                       {comparison.driverA.code}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                       <span className="w-4 h-0.5 rounded" style={{ backgroundColor: comparison.driverB.displayColor, borderTop: comparison.driverB.lineStyle === 'dashed' ? `2px dashed ${comparison.driverB.displayColor}` : undefined }} />
                                       {comparison.driverB.code}
                                    </span>
                                 </div>
                              </div>
                              <div className="h-60 !overflow-visible relative">
                                 <ResponsiveLine
                                    data={speedLineData}
                                    margin={{ top: 25, right: 30, bottom: 40, left: 50 }}
                                    xScale={{ type: 'linear', min: 0, max: 100 }}
                                    yScale={{ type: 'linear', min: 60, max: 380 }}
                                    curve="monotoneX"
                                    lineWidth={2}
                                    colors={[comparison.driverA.displayColor, comparison.driverB.displayColor]}
                                    pointSize={0}
                                    enableSlices="x"
                                    crosshairType="x"
                                    layers={[
                                       'grid',
                                       'markers',
                                       'axes',
                                       'areas',
                                       'crosshair',
                                       'lines',
                                       'points',
                                       createAdaptiveSliceLayer((slice) => (
                                          <SpeedSliceTooltip slice={slice} comparison={comparison} />
                                       )),
                                       'legends',
                                    ]}
                                    enableGridX={false}
                                    enableArea={false}
                                    axisBottom={{
                                       tickValues: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                                       format: (v) => `${v}%`,
                                    }}
                                    axisLeft={{ tickValues: 5 }}
                                    theme={nivoTheme}
                                 />
                              </div>
                           </div>

                           {/* ── Delta Time Gap ── */}
                           <div className="telemetry-card p-5">
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                                       Cumulative Time Gap Δt (seconds)
                                    </h3>
                                 </div>
                                 <span className="text-[11px] font-mono text-f1-silver/60">
                                    Negative = <strong style={{ color: comparison.driverA.displayColor }}>{comparison.driverA.code}</strong> ahead
                                 </span>
                              </div>
                              <div className="h-48 !overflow-visible relative">
                                 <ResponsiveLine
                                    data={deltaLineData}
                                    margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
                                    xScale={{ type: 'linear', min: 0, max: 100 }}
                                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                                    curve="monotoneX"
                                    lineWidth={2}
                                    colors={['#10B981']}
                                    pointSize={0}
                                    enableSlices="x"
                                    crosshairType="x"
                                    layers={[
                                       'grid',
                                       'markers',
                                       'axes',
                                       'areas',
                                       'crosshair',
                                       'lines',
                                       'points',
                                       createAdaptiveSliceLayer((slice) => (
                                          <DeltaSliceTooltip slice={slice} comparison={comparison} />
                                       )),
                                       'legends',
                                    ]}
                                    enableArea={true}
                                    areaOpacity={0.1}
                                    enableGridX={false}
                                    axisBottom={{
                                       tickValues: [0, 25, 50, 75, 100],
                                       format: (v) => `${v}%`,
                                    }}
                                    axisLeft={{ tickValues: 5 }}
                                    theme={nivoTheme}
                                 />
                              </div>
                           </div>

                           {/* ── Throttle & Brake side-by-side ── */}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              <div className="telemetry-card chart-card p-5 !overflow-visible relative z-10">
                                 <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-4">Throttle Application (%)</h4>
                                 <div className="h-48 !overflow-visible relative">
                                    <ResponsiveLine
                                       data={throttleLineData}
                                       margin={{ top: 20, right: 30, bottom: 40, left: 45 }}
                                       xScale={{ type: 'linear', min: 0, max: 100 }}
                                       yScale={{ type: 'linear', min: 0, max: 100 }}
                                       curve="monotoneX"
                                       lineWidth={2}
                                       colors={[comparison.driverA.displayColor, comparison.driverB.displayColor]}
                                       pointSize={0}
                                       enableSlices="x"
                                       crosshairType="x"
                                       layers={[
                                          'grid',
                                          'markers',
                                          'axes',
                                          'areas',
                                          'crosshair',
                                          'lines',
                                          'points',
                                          createAdaptiveSliceLayer((slice) => (
                                             <ChannelSliceTooltip slice={slice} channel="Throttle" unit="%" comparison={comparison} />
                                          )),
                                          'legends',
                                       ]}
                                       enableGridX={false}
                                       axisBottom={{
                                          tickValues: [0, 25, 50, 75, 100],
                                          format: (v) => `${v}%`,
                                       }}
                                       axisLeft={{ tickValues: 5 }}
                                       theme={nivoTheme}
                                    />
                                 </div>
                              </div>

                              <div className="telemetry-card chart-card p-5 !overflow-visible relative z-10">
                                 <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-4">Braking Pressure (%)</h4>
                                 <div className="h-48 !overflow-visible relative">
                                    <ResponsiveLine
                                       data={brakeLineData}
                                       margin={{ top: 20, right: 30, bottom: 40, left: 45 }}
                                       xScale={{ type: 'linear', min: 0, max: 100 }}
                                       yScale={{ type: 'linear', min: 0, max: 100 }}
                                       curve="stepAfter"
                                       lineWidth={2}
                                       colors={[comparison.driverA.displayColor, comparison.driverB.displayColor]}
                                       enableSlices="x"
                                       crosshairType="x"
                                       layers={[
                                          'grid',
                                          'markers',
                                          'axes',
                                          'areas',
                                          'crosshair',
                                          'lines',
                                          'points',
                                          createAdaptiveSliceLayer((slice) => (
                                             <ChannelSliceTooltip slice={slice} channel="Brake" unit="%" comparison={comparison} />
                                          )),
                                          'legends',
                                       ]}
                                       enableGridX={false}
                                       axisBottom={{
                                          tickValues: [0, 25, 50, 75, 100],
                                          format: (v) => `${v}%`,
                                       }}
                                       axisLeft={{ tickValues: 5 }}
                                       theme={nivoTheme}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* ─── Sector Insights Tab ─── */}
                     {activeTab === 'insights' && (
                        <div className="space-y-5">
                           <div className="telemetry-card p-5 bg-gradient-to-r from-f1-carbon to-f1-abyss flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                                 <Zap className="w-5 h-5" />
                              </div>
                              <div>
                                 <h3 className="text-sm font-display font-bold text-f1-white uppercase">Race Engineer Verdict</h3>
                                 <p className="text-xs font-mono text-f1-silver/80 mt-0.5">{comparison.summary.overallVerdict}</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                              {comparison.sectorInsights.map((s) => {
                                 const isAFaster = s.fasterDriver === 'A';
                                 const winnerCode = isAFaster ? comparison.driverA.code : comparison.driverB.code;
                                 const winnerColor = isAFaster ? comparison.driverA.displayColor : comparison.driverB.displayColor;
                                 const sectorTimes = [
                                    [comparison.driverA.s1Time, comparison.driverB.s1Time],
                                    [comparison.driverA.s2Time, comparison.driverB.s2Time],
                                    [comparison.driverA.s3Time, comparison.driverB.s3Time],
                                 ];

                                 return (
                                    <div key={s.sectorNumber} className="telemetry-card p-5 flex flex-col justify-between border-t-4" style={{ borderTopColor: winnerColor }}>
                                       <div>
                                          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                                             <span className="text-xs font-mono font-bold text-f1-white uppercase">Sector {s.sectorNumber}</span>
                                             <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ backgroundColor: `${winnerColor}20`, color: winnerColor }}>
                                                {winnerCode} +{Math.abs(s.timeDelta)}s
                                             </span>
                                          </div>
                                          <h4 className="text-sm font-display font-bold text-f1-white mb-2">{s.title}</h4>
                                          <p className="text-xs font-mono text-f1-silver/70 leading-relaxed">{s.analysisText}</p>
                                       </div>
                                       <div className="pt-3 mt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs font-mono">
                                          <div>
                                             <span className="text-f1-silver/50 block" style={{ color: comparison.driverA.displayColor }}>{comparison.driverA.code}</span>
                                             <span className="text-f1-white font-bold">{sectorTimes[s.sectorNumber - 1][0]}s</span>
                                          </div>
                                          <div>
                                             <span className="text-f1-silver/50 block" style={{ color: comparison.driverB.displayColor }}>{comparison.driverB.code}</span>
                                             <span className="text-f1-white font-bold">{sectorTimes[s.sectorNumber - 1][1]}s</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}

                     {/* ─── Corner Apex Matrix Tab ─── */}
                     {activeTab === 'corners' && (
                        <div className="space-y-5">
                           <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-2">
                                 {(['ALL', 'A', 'B'] as const).map((f) => (
                                    <button
                                       key={f}
                                       onClick={() => setCornerFilter(f)}
                                       className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${cornerFilter === f
                                          ? f === 'ALL' ? 'bg-f1-white text-f1-black' : f === 'A' ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white'
                                          : 'bg-white/[0.04] text-f1-silver/70 hover:text-white'
                                          }`}
                                    >
                                       {f === 'ALL' ? `All (${comparison.corners.length})` : f === 'A' ? `${comparison.driverA.code} faster (${comparison.summary.sectorsFasterA})` : `${comparison.driverB.code} faster (${comparison.summary.sectorsFasterB})`}
                                    </button>
                                 ))}
                              </div>
                              <span className="text-xs font-mono text-f1-silver/60">
                                 {currentCircuit.name} — {currentCircuit.cornerMarkers?.length ?? currentCircuit.corners} corners
                              </span>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredCorners.map((corner) => {
                                 const isAFaster = corner.fasterDriver === 'A';
                                 const isBFaster = corner.fasterDriver === 'B';
                                 return (
                                    <div
                                       key={corner.cornerNumber}
                                       className={`telemetry-card p-4 hover:border-white/20 transition-all ${isAFaster ? 'border-l-4 border-l-emerald-500' : isBFaster ? 'border-l-4 border-l-sky-500' : ''
                                          }`}
                                    >
                                       <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                             <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-black text-f1-white">
                                                T{corner.cornerNumber}
                                             </span>
                                             <div>
                                                <h4 className="text-xs font-display font-bold text-f1-white">{corner.cornerName}</h4>
                                                <span className="text-[10px] font-mono text-f1-silver/50 uppercase">{corner.cornerType}</span>
                                             </div>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isAFaster ? 'bg-emerald-500/15 text-emerald-400' : isBFaster ? 'bg-sky-500/15 text-sky-300' : 'bg-white/[0.05] text-f1-silver/70'}`}>
                                             {isAFaster ? `${comparison.driverA.code} +${Math.abs(corner.deltaApexSpeed)}` : isBFaster ? `${comparison.driverB.code} +${Math.abs(corner.deltaApexSpeed)}` : 'Equal'} km/h
                                          </span>
                                       </div>

                                       <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-white/[0.06]">
                                          <div className="flex justify-between">
                                             <span className="text-f1-silver/60">Apex Speed:</span>
                                             <span>
                                                <span style={{ color: comparison.driverA.displayColor }}>{corner.apexSpeedA}</span>
                                                {' vs '}
                                                <span style={{ color: comparison.driverB.displayColor }}>{corner.apexSpeedB}</span>
                                                {' km/h'}
                                             </span>
                                          </div>
                                          <div className="flex justify-between">
                                             <span className="text-f1-silver/60">Entry / Exit:</span>
                                             <span className="text-f1-silver/90">{corner.entrySpeedA}/{corner.exitSpeedA} vs {corner.entrySpeedB}/{corner.exitSpeedB}</span>
                                          </div>
                                          <div className="flex justify-between">
                                             <span className="text-f1-silver/60">Apex Gear:</span>
                                             <span className="text-f1-white">G{corner.apexGearA} vs G{corner.apexGearB}</span>
                                          </div>
                                          <div className="flex justify-between">
                                             <span className="text-f1-silver/60">Time Δ:</span>
                                             <span className={corner.timeDelta <= 0 ? 'text-emerald-400 font-bold' : 'text-sky-400 font-bold'}>
                                                {corner.timeDelta <= 0 ? corner.timeDelta : `+${corner.timeDelta}`}s
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </>
               )}
            </>
         )}
      </div>
   );
};

export default TelemetryGhostPage;
