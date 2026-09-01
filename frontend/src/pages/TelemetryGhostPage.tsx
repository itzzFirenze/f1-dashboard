import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { circuits } from '../data/circuits';
import { driverService } from '../services/driverService';
import { raceService } from '../services/raceService';
import {
   generateTelemetryComparison,
   TelemetryComparisonResult,
   TelemetryDataPoint,
} from '../services/telemetryAnalysisService';
import type { Driver, Race, RaceDetail } from '../types';

import { TelemetryMatchupHeader, LapMode } from '../components/telemetry/TelemetryMatchupHeader';
import { GhostLapReplay } from '../components/telemetry/GhostLapReplay';
import { TelemetryTracesView } from '../components/telemetry/TelemetryTracesView';
import { TelemetryAnalysisTabs } from '../components/telemetry/TelemetryAnalysisTabs';

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

// ─── Component ───────────────────────────────────────────────────────────────

const TelemetryGhostPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [races, setRaces] = useState<Race[]>([]);
   const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
   const [currentRaceDetail, setCurrentRaceDetail] = useState<RaceDetail | null>(null);

   const [lapMode, setLapMode] = useState<LapMode>('Q3');

   const [drivers, setDrivers] = useState<Driver[]>([]);
   const [driverA, setDriverA] = useState<Driver | null>(null);
   const [driverB, setDriverB] = useState<Driver | null>(null);

   // Playback state — progress lives in a ref to avoid React re-renders on every frame
   const progressRef = useRef<number>(0);
   const [displayProgress, setDisplayProgress] = useState<number>(0);
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

   // Refs for scrub-then-auto-resume behavior (debounced, onChange-driven)
   const wasPlayingBeforeScrubRef = useRef<boolean>(false);
   const isScrubbingRef = useRef<boolean>(false);
   const scrubResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

   // Sparse chart data
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

   // Binary-search a driver's own time series to find their true distance% at a given elapsed time
   function findDistancePctAtTime(
      points: TelemetryDataPoint[],
      elapsedSec: number,
      timeKey: 'timeA' | 'timeB',
   ): number {
      const totalLapTime = points[points.length - 1][timeKey];
      if (elapsedSec >= totalLapTime) return 100; // this driver has already finished — hold at the line
      if (elapsedSec <= 0) return 0;

      let lo = 0;
      let hi = points.length - 1;
      while (lo < hi) {
         const mid = (lo + hi) >> 1;
         if (points[mid][timeKey] < elapsedSec) lo = mid + 1;
         else hi = mid;
      }
      const i1 = lo;
      const i0 = Math.max(0, i1 - 1);
      const t0 = points[i0][timeKey];
      const t1 = points[i1][timeKey];
      const frac = t1 > t0 ? (elapsedSec - t0) / (t1 - t0) : 0;
      return points[i0].distancePct + (points[i1].distancePct - points[i0].distancePct) * frac;
   }

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

         const lapSec = Math.max(comparison.driverA.lapTimeSeconds, comparison.driverB.lapTimeSeconds);
         const clampedPct = Math.min(Math.max(pct, 0), 100);
         const elapsedSec = (clampedPct / 100) * lapSec;

         // Each driver's own distance progress at this shared elapsed time — not a shared index
         const smoothPctA = findDistancePctAtTime(pts, elapsedSec, 'timeA');
         const smoothPctB = findDistancePctAtTime(pts, elapsedSec, 'timeB');

         const posA = getPathXY(svgPathRef.current, smoothPctA, len);
         const posB = getPathXY(svgPathRef.current, smoothPctB, len);

         // Nearest sample point for any consumers that want raw telemetry at this instant
         const refIdx = Math.min(
            pts.length - 1,
            Math.round((elapsedSec / lapSec) * (pts.length - 1)),
         );

         return { posA, posB, pt: pts[refIdx] };
      },
      [comparison],
   );

   // ── DOM-direct animation loop ──────────────────────────────────────────────

   const applyFrame = useCallback(
      (pct: number) => {
         if (ghostARef.current && ghostBRef.current && svgPathRef.current) {
            const res = getGhostPositions(pct);
            if (res) {
               const { posA, posB } = res;
               if (posA) ghostARef.current.setAttribute('transform', `translate(${posA.x} ${posA.y})`);
               if (posB) ghostBRef.current.setAttribute('transform', `translate(${posB.x} ${posB.y})`);

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
         const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
         lastTimeRef.current = time;

         const lapSec = Math.max(
            comparison?.driverA.lapTimeSeconds ?? 85,
            comparison?.driverB.lapTimeSeconds ?? 85,
         );
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

   // Clean up any pending scrub-resume timer on unmount
   useEffect(() => {
      return () => {
         if (scrubResumeTimerRef.current) clearTimeout(scrubResumeTimerRef.current);
      };
   }, []);

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

   /**
    * Scrubbing is driven entirely by onChange, which fires on every step of a
    * drag as well as on a single click. On the first event of a gesture we
    * remember whether playback was active and pause it. Each subsequent event
    * resets a short debounce timer; once events stop arriving for 150ms we
    * treat the gesture as finished and resume playback if it was running
    * before the user touched the slider.
    */
   const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isScrubbingRef.current) {
         isScrubbingRef.current = true;
         wasPlayingBeforeScrubRef.current = isPlaying;
         if (isPlaying) setIsPlaying(false);
      }

      const val = parseFloat(e.target.value);
      progressRef.current = val;
      setDisplayProgress(val);
      applyFrame(val);

      if (scrubResumeTimerRef.current) clearTimeout(scrubResumeTimerRef.current);
      scrubResumeTimerRef.current = setTimeout(() => {
         isScrubbingRef.current = false;
         if (wasPlayingBeforeScrubRef.current && val < 100) {
            setIsPlaying(true);
         }
         wasPlayingBeforeScrubRef.current = false;
         scrubResumeTimerRef.current = null;
      }, 150);
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

   const modeLabel = lapMode === 'Q3' ? 'Quali Best Lap' : 'Race Best Lap';
   const resultLabelA = lapMode === 'Q3'
      ? (driverAResult?.q3 ?? driverAResult?.q2 ?? driverAResult?.q1 ?? comparison?.driverA.lapTime ?? '—')
      : (lapTimeStrA ?? comparison?.driverA.lapTime ?? '—');
   const resultLabelB = lapMode === 'Q3'
      ? (driverBResult?.q3 ?? driverBResult?.q2 ?? driverBResult?.q1 ?? comparison?.driverB.lapTime ?? '—')
      : (lapTimeStrB ?? comparison?.driverB.lapTime ?? '—');

   const driversForB = useMemo(() => drivers.filter((d) => !driverA || d.id !== driverA.id), [drivers, driverA]);
   const driversForA = useMemo(() => drivers.filter((d) => !driverB || d.id !== driverB.id), [drivers, driverB]);

   // ── Render ────────────────────────────────────────────────────────────────

   return (
      <div className="space-y-7 animate-fade-in">
         {/* 1. Hero, Selectors, Alerts & Head-to-Head Cards */}
         <TelemetryMatchupHeader
            season={season}
            setSeason={setSeason}
            races={races}
            selectedRaceId={selectedRaceId}
            setSelectedRaceId={setSelectedRaceId}
            activeRace={activeRace}
            lapMode={lapMode}
            setLapMode={setLapMode}
            driverA={driverA}
            setDriverA={setDriverA}
            driverB={driverB}
            setDriverB={setDriverB}
            driversForA={driversForA}
            driversForB={driversForB}
            swapDrivers={swapDrivers}
            isCompletedSession={isCompletedSession}
            isCancelled={isCancelled}
            comparison={comparison}
            driverAResult={driverAResult}
            driverBResult={driverBResult}
            resultLabelA={resultLabelA}
            resultLabelB={resultLabelB}
            modeLabel={modeLabel}
            isTeammates={isTeammates}
         />

         {/* 2, 3, 4. Analysis Tabs, Ghost Lap Replay & Telemetry Traces */}
         {isCompletedSession && comparison && (
            <TelemetryAnalysisTabs
               activeTab={activeTab}
               setActiveTab={setActiveTab}
               comparison={comparison}
               currentCircuit={currentCircuit}
               cornerFilter={cornerFilter}
               setCornerFilter={setCornerFilter}
               filteredCorners={filteredCorners}
            >
               {/* Tab 1: Ghost Replay Map & Traces */}
               <GhostLapReplay
                  currentCircuit={currentCircuit}
                  comparison={comparison}
                  lapMode={lapMode}
                  cameraMode={cameraMode}
                  setCameraModeAndApply={setCameraModeAndApply}
                  zoomLevel={zoomLevel}
                  setZoomLevelAndApply={setZoomLevelAndApply}
                  displayProgress={displayProgress}
                  svgElRef={svgElRef}
                  svgPathRef={svgPathRef}
                  ghostARef={ghostARef}
                  ghostBRef={ghostBRef}
                  scrubberRef={scrubberRef}
                  playbackSpeed={playbackSpeed}
                  setPlaybackSpeed={setPlaybackSpeed}
                  isPlaying={isPlaying}
                  hasFinished={hasFinished}
                  togglePlay={togglePlay}
                  resetPlay={resetPlay}
                  handleScrub={handleScrub}
               />

               <TelemetryTracesView
                  comparison={comparison}
                  speedLineData={speedLineData}
                  deltaLineData={deltaLineData}
                  throttleLineData={throttleLineData}
                  brakeLineData={brakeLineData}
               />
            </TelemetryAnalysisTabs>
         )}
      </div>
   );
};

export default TelemetryGhostPage;