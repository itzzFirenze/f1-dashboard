import React, { useId, useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import { CircuitData, CircuitCornerMarker } from '../../data/circuits';
import { OpenF1Driver, OpenF1Lap, OpenF1Location, OpenF1Pit } from '../../services/telemetryService';
import CornerMarker from './CornerMarker';
import ActiveAeroZone from './ActiveAeroZone';
import SectorPath from './SectorPath';
import SpeedTrapMarker from './SpeedTrapMarker';
import FinishLineMarker from './FinishLineMarker';
import PitLaneOverlay from './PitLaneOverlay';
import { usePathPoint } from './usePathPoint';

interface InteractiveReplayMapProps {
   circuit: CircuitData;
}

const DetectionPoint: React.FC<{ pathId: string; point: { id: string; label: string; positionPercent: number } }> = ({ pathId, point }) => {
   const position = usePathPoint(pathId, point.positionPercent);
   return (
      <g transform={`translate(${position.x} ${position.y})`}>
         <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" fill="#f59e0b" stroke="#fde68a" strokeWidth="1" />
         <text x="8" y="3" fontSize="7" fill="#fde68a">{point.label}</text>
      </g>
   );
};

const DEFAULT_PIT_BOX_SEC = 25;

const DriverMarkerOnTrack = React.memo(({
   driver,
   isSelected,
   location,
   projectLocation,
   onSelect,
   onHover,
}: {
   driver: OpenF1Driver;
   isSelected: boolean;
   location?: OpenF1Location;
   projectLocation: (location?: OpenF1Location) => TrackPoint | null;
   onSelect: () => void;
   onHover: (driverNo: number | null) => void;
}) => {
   const locationPos = projectLocation(location);
   const teamColor = `#${driver.team_colour || 'ffffff'}`;

   // Never animate a car from lap time. If an x/y sample is not available yet,
   // keep its marker hidden until the location feed supplies one.
   if (!locationPos) return null;
   const drawX = locationPos.x;
   const drawY = locationPos.y;

   return (
      <g
         onClick={onSelect}
         onMouseEnter={() => onHover(driver.driver_number)}
         onMouseLeave={() => onHover(null)}
         className="cursor-pointer group"
      >
         {isSelected && (
            <circle cx={drawX} cy={drawY} r="14" fill="transparent" stroke={teamColor} strokeWidth="2"
               className="animate-ping opacity-75 [transform-box:fill-box] [transform-origin:center]" />
         )}
         <circle cx={drawX} cy={drawY} r="9" fill="#0f172a"
            stroke={teamColor} strokeWidth="2"
            className="transition-transform duration-300 group-hover:scale-125 [transform-box:fill-box] [transform-origin:center]" />
         <circle cx={drawX} cy={drawY} r="5.5" fill={teamColor}
            className="transition-transform duration-300 group-hover:scale-125 [transform-box:fill-box] [transform-origin:center]" />
         <text x={drawX} y={drawY - 13} textAnchor="middle" fontSize="9" fontWeight="800" fill="#f8fafc"
            className="select-none font-mono filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {driver.name_acronym}
         </text>
      </g>
   );
}, (previous, next) =>
   previous.driver === next.driver &&
   previous.isSelected === next.isSelected &&
   previous.location === next.location &&
   previous.projectLocation === next.projectLocation
);

type TrackPoint = { x: number; y: number };
type LocationProjector = (location?: OpenF1Location) => TrackPoint | null;

/** Calibrate from one ordered, full-lap location trace. Matching lap progress
 * to SVG progress avoids the expensive and unstable fit against a whole race's
 * mixed driver cloud. The resulting transform is calculated once per circuit
 * and each frame maps a car with a few arithmetic operations. */
const useTrackProjection = (pathId: string, locations: OpenF1Location[]): LocationProjector => {
   const [trackSamples, setTrackSamples] = React.useState<TrackPoint[] | null>(null);
   useEffect(() => {
      const path = document.getElementById(pathId) as SVGPathElement | null;
      if (!path) return;
      const length = path.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) return;
      const steps = 1000;
      const samples: TrackPoint[] = [];
      for (let i = 0; i < steps; i++) {
         const p = path.getPointAtLength((i / steps) * length);
         samples.push({ x: p.x, y: p.y });
      }
      setTrackSamples(samples);
   }, [pathId]);

   const transform = useMemo(() => {
      if (!trackSamples || locations.length < 30) return null;
      // The API reports locations at roughly even time intervals, while the
      // SVG path is sampled at even distances. Pairing by array index therefore
      // overweights straights and underweights slow corners, which can shift the
      // fitted track sideways. Build progress from the measured x/y distance.
      const cumulativeDistance = new Array<number>(locations.length).fill(0);
      for (let index = 1; index < locations.length; index++) {
         cumulativeDistance[index] = cumulativeDistance[index - 1] + Math.hypot(
            locations[index].x - locations[index - 1].x,
            locations[index].y - locations[index - 1].y,
         );
      }
      const totalDistance = cumulativeDistance[cumulativeDistance.length - 1];
      if (!Number.isFinite(totalDistance) || totalDistance <= 0) return null;
      const sourceStride = Math.max(1, Math.ceil(locations.length / 180));
      const source = locations.map(({ x, y }, index) => ({
            x,
            y,
            progress: cumulativeDistance[index] / totalDistance,
         }))
         .filter((_, index) => index % sourceStride === 0 || index === locations.length - 1);
      if (source.length < 30) return null;
      const sourceCenter = source.reduce((sum, p) => ({ x: sum.x + p.x / source.length, y: sum.y + p.y / source.length }), { x: 0, y: 0 });
      let sourceVariance = 0;
      for (const p of source) sourceVariance += (p.x - sourceCenter.x) ** 2 + (p.y - sourceCenter.y) ** 2;
      if (sourceVariance < 1) return null;

      const fit = (target: TrackPoint[], mirror: number) => {
         const targetCenter = target.reduce((sum, p) => ({ x: sum.x + p.x / target.length, y: sum.y + p.y / target.length }), { x: 0, y: 0 });
         let dot = 0, cross = 0;
         for (let i = 0; i < source.length; i++) {
            const sx = source[i].x - sourceCenter.x;
            const sy = (source[i].y - sourceCenter.y) * mirror;
            const tx = target[i].x - targetCenter.x;
            const ty = target[i].y - targetCenter.y;
            dot += sx * tx + sy * ty;
            cross += sx * ty - sy * tx;
         }
         const angle = Math.atan2(cross, dot);
         const scale = Math.hypot(dot, cross) / sourceVariance;
         const cos = Math.cos(angle), sin = Math.sin(angle);
         let error = 0;
         for (let i = 0; i < source.length; i++) {
            const sx = source[i].x - sourceCenter.x;
            const sy = (source[i].y - sourceCenter.y) * mirror;
            const x = targetCenter.x + scale * (sx * cos - sy * sin);
            const y = targetCenter.y + scale * (sx * sin + sy * cos);
            error += (x - target[i].x) ** 2 + (y - target[i].y) ** 2;
         }
         return { sourceCenter, targetCenter, angle, scale, mirror, error };
      };

      let best: ReturnType<typeof fit> | null = null;
      const targetCount = trackSamples.length;
      // Try both driving directions and reflections, searching the lap start
      // in half-percent increments. This is a one-time, small calibration.
      const phaseStep = 5;
      for (const direction of [1, -1]) {
         for (const mirror of [1, -1]) {
            for (let phase = 0; phase < targetCount; phase += phaseStep) {
               const target = source.map((_, index) => {
               const progress = source[index].progress;
                  const sampleIndex = ((Math.round(phase + direction * progress * targetCount) % targetCount) + targetCount) % targetCount;
                  return trackSamples[sampleIndex];
               });
               const candidate = fit(target, mirror);
               if (!best || candidate.error < best.error) best = candidate;
            }
         }
      }
      return best && best.scale > 0 ? best : null;
   }, [locations, trackSamples]);

   return useMemo(() => (location?: OpenF1Location): TrackPoint | null => {
      if (!location || !transform) return null;
      const { sourceCenter, targetCenter, angle, scale, mirror } = transform;
      const dx = location.x - sourceCenter.x;
      const dy = (location.y - sourceCenter.y) * mirror;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      return {
         x: targetCenter.x + scale * (dx * cos - dy * sin),
         y: targetCenter.y + scale * (dx * sin + dy * cos),
      };
   }, [transform]);
};

const formatElapsed = (ms: number): string => {
   const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
   const hours = Math.floor(totalSeconds / 3600);
   const minutes = Math.floor((totalSeconds % 3600) / 60);
   const seconds = totalSeconds % 60;
   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getPitDurationSec = (pit: OpenF1Pit): number =>
   pit.lane_duration ?? pit.pit_duration ?? DEFAULT_PIT_BOX_SEC;

const getLapStartMs = (
   laps: OpenF1Lap[],
   driverNumber: number,
   lapNumber: number
): number | null => {
   const lap = laps.find(
      (candidate) =>
         candidate.driver_number === driverNumber &&
         candidate.lap_number === lapNumber &&
         candidate.date_start
   );
   if (!lap?.date_start) return null;

   const startMs = new Date(lap.date_start).getTime();
   return Number.isFinite(startMs) ? startMs : null;
};

const getLapEndMs = (
   laps: OpenF1Lap[],
   driverNumber: number,
   lapNumber: number
): number | null => {
   const lap = laps.find(
      (candidate) =>
         candidate.driver_number === driverNumber &&
         candidate.lap_number === lapNumber &&
         candidate.date_start &&
         candidate.lap_duration &&
         candidate.lap_duration > 0
   );
   if (!lap?.date_start || !lap.lap_duration) return null;

   const startMs = new Date(lap.date_start).getTime();
   if (!Number.isFinite(startMs)) return null;

   return startMs + lap.lap_duration * 1000;
};

const getPitTimingWindow = (pit: OpenF1Pit | null, laps: OpenF1Lap[]): { start: number; end: number } | null => {
   if (!pit?.date) return null;

   const pitMs = new Date(pit.date).getTime();
   if (!Number.isFinite(pitMs)) return null;

   const nextLapStartMs = getLapStartMs(laps, pit.driver_number, pit.lap_number + 1);
   const startMs = nextLapStartMs !== null && nextLapStartMs <= pitMs
      ? nextLapStartMs
      : pitMs;

   return {
      start: startMs,
      end: startMs + getPitDurationSec(pit) * 1000,
   };
};

const getTravelPercentBetween = (
   entryPercent: number,
   exitPercent: number,
   progress: number,
   isReversed: boolean
): number => {
   const safeProgress = Math.min(1, Math.max(0, progress));

   if (!isReversed) {
      const forwardDistance = exitPercent >= entryPercent
         ? exitPercent - entryPercent
         : exitPercent + 100 - entryPercent;
      return (entryPercent + forwardDistance * safeProgress) % 100;
   }

   const backwardDistance = entryPercent >= exitPercent
      ? entryPercent - exitPercent
      : entryPercent + 100 - exitPercent;
   return (entryPercent - backwardDistance * safeProgress + 100) % 100;
};

const getPitReplayPosition = (
   driverNumber: number,
   time: Date | null,
   pits: OpenF1Pit[],
   laps: OpenF1Lap[],
   circuit: CircuitData
): { isPitting: boolean; percent: number } | null => {
   if (!time) return null;

   const nowMs = time.getTime();
   const driverPits = pits
      .filter((pit) => pit.driver_number === driverNumber)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

   for (const pit of driverPits) {
      const pitWindow = getPitTimingWindow(pit, laps);
      if (!pitWindow) continue;

      if (nowMs >= pitWindow.start && nowMs <= pitWindow.end) {
         const pitProgress = (nowMs - pitWindow.start) / (pitWindow.end - pitWindow.start);
         return {
            isPitting: true,
            percent: getTravelPercentBetween(
               circuit.pitLane.entryPercent,
               circuit.pitLane.exitPercent,
               pitProgress,
               circuit.isReversed
            ),
         };
      }

      const outLapEndMs = getLapEndMs(laps, driverNumber, pit.lap_number + 1);
      if (outLapEndMs !== null && nowMs > pitWindow.end && nowMs < outLapEndMs) {
         const progressAfterPit = (nowMs - pitWindow.end) / (outLapEndMs - pitWindow.end);
         return {
            isPitting: false,
            percent: getTravelPercentBetween(
               circuit.pitLane.exitPercent,
               circuit.sectors[0].startPercent,
               progressAfterPit,
               circuit.isReversed
            ),
         };
      }
   }

   return null;
};

const getDriverRaceFraction = (
   driverNumber: number,
   index: number,
   currentTime: Date | null,
   laps: OpenF1Lap[]
): number => {
   if (!currentTime || !laps || laps.length === 0) {
      return (index * 2.2) % 100;
   }

   const nowMs = currentTime.getTime();
   const driverLaps = laps.filter(
      (l) => l.driver_number === driverNumber && l.date_start && new Date(l.date_start).getTime() <= nowMs
   );

   if (driverLaps.length === 0) {
      return 0;
   }

   const activeLap = driverLaps.reduce((latest, l) =>
      new Date(l.date_start!).getTime() > new Date(latest.date_start!).getTime() ? l : latest
      , driverLaps[0]);

   const lapStartMs = new Date(activeLap.date_start!).getTime();
   const hasRealDuration = Boolean(activeLap.lap_duration && activeLap.lap_duration > 0);
   const elapsedSec = Math.max(0, (nowMs - lapStartMs) / 1000);

   // If the lap has no recorded duration (e.g. driver DNF'd mid-lap), clamp the
   // denominator to at least the actual elapsed time so the fraction never exceeds
   // 1.0. This freezes the car marker at its last known position instead of
   // extrapolating it around the track and back to the finish line.
   const lapDurationSec = hasRealDuration
      ? activeLap.lap_duration!
      : Math.max(90, elapsedSec);

   return Math.min(99.5, Math.max(0, (elapsedSec / lapDurationSec) * 100));
};

const getDriverLapElapsed = (
   driverNumber: number,
   currentTime: Date | null,
   laps: OpenF1Lap[]
): { lapNumber: number; elapsedSec: number } | null => {
   if (!currentTime) return null;

   const nowMs = currentTime.getTime();
   const driverLaps = laps.filter(
      (l) => l.driver_number === driverNumber && l.date_start && new Date(l.date_start).getTime() <= nowMs
   );

   if (driverLaps.length === 0) return null;

   const activeLap = driverLaps.reduce((latest, l) =>
      new Date(l.date_start!).getTime() > new Date(latest.date_start!).getTime() ? l : latest
      , driverLaps[0]);

   const lapStartMs = new Date(activeLap.date_start!).getTime();
   const elapsedSec = Math.max(0, (nowMs - lapStartMs) / 1000);

   return { lapNumber: activeLap.lap_number, elapsedSec };
};

const formatLapTime = (seconds: number): string => {
   const m = Math.floor(seconds / 60);
   const s = seconds % 60;
   return `${m}:${s.toFixed(3).padStart(6, '0')}`;
};

export const InteractiveReplayMap: React.FC<InteractiveReplayMapProps> = ({ circuit }) => {
   const mapId = useId();
   // Keep path-dependent geometry and location registration isolated per circuit.
   // The replay map can switch circuits without unmounting, so mapId alone is not
   // enough to invalidate cached SVG points.
   const pathId = useMemo(() => `replay-track-${mapId.replace(/:/g, '')}-${circuit.id}`, [mapId, circuit.id]);
   const {
      drivers,
      driverLocations,
      trackReferenceLocations,
      selectedDrivers,
      toggleDriverSelection,
      laps,
      pits,
      currentTime,
      isDriverOutAt,
      safetyCarStatus,
      activeSession,
      isPlaying,
      playbackSpeed,
      progressPercent,
      elapsedMs,
      play,
      pause,
      stop,
      skip,
      setSpeed,
      scrubToPercent,
      jumpToLap,
   } = useReplay();

   const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);
   const [selectedCorner, setSelectedCorner] = useState<CircuitCornerMarker | null>(null);
   const [selectedLap, setSelectedLap] = useState<string>('');
   const projectLocation = useTrackProjection(pathId, trackReferenceLocations);

   useEffect(() => {
      setSelectedCorner(null);
      setHoveredDriver(null);
      setSelectedLap('');
   }, [circuit.id, activeSession?.session_key]);

   useEffect(() => {
      return () => {
         pause();
      };
   }, [pause]);

   const handleHover = useCallback((driverNo: number | null) => setHoveredDriver(driverNo), []);

   const currentLap = useMemo(() => {
      if (!currentTime || laps.length === 0) return null;

      const nowMs = currentTime.getTime();
      const startedLaps = laps.filter((l) => l.date_start && new Date(l.date_start).getTime() <= nowMs);

      if (startedLaps.length === 0) return null;

      return startedLaps.reduce((max, l) => Math.max(max, l.lap_number), 0);
   }, [laps, currentTime]);

   // Prefer whichever driver the user is hovering; fall back to the first
   // selected driver. This is the driver the live lap-timer HUD tracks.
   const focusDriverNumber = hoveredDriver ?? selectedDrivers[0] ?? null;
   const focusDriver = focusDriverNumber
      ? drivers.find((d) => d.driver_number === focusDriverNumber)
      : null;
   const focusLapElapsed = focusDriverNumber
      ? getDriverLapElapsed(focusDriverNumber, currentTime, laps)
      : null;

   return (
      <div className="telemetry-card flex flex-col h-[590px] overflow-hidden relative">
         <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent z-10" />
         {/* Map area */}
         <div className="relative flex-1 min-h-0 p-3 pb-1">
            {/* HUD Info */}
            <div className="absolute left-3 top-3 z-10 space-y-0.5 max-w-[42%] sm:max-w-[50%]">
               <h3 className="font-display text-xs sm:text-sm font-bold text-f1-white leading-tight">{circuit.name}</h3>
               <p className="flex items-start gap-1 text-[9px] sm:text-[10px] font-mono text-f1-silver/60 uppercase tracking-wide leading-tight">
                  <MapPin className="h-3 w-3 shrink-0 text-f1-red-light" />
                  <span>{circuit.location}, {circuit.country}</span>
               </p>
            </div>

            {/* HUD Badges */}
            <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1 max-w-[55%]">
               {trackReferenceLocations.length === 0 && drivers.length > 0 && (
                  <span className="rounded-md border border-f1-red/40 bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-f1-silver/80 flex items-center gap-1 backdrop-blur-sm">
                     <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                     Calibrating GPS...
                  </span>
               )}
               {safetyCarStatus.active && (
                  <span className="rounded-md border border-yellow-300 bg-yellow-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black animate-pulse">
                     {safetyCarStatus.isVirtual ? 'VSC' : 'Safety Car'}
                  </span>
               )}
               <span className="rounded-md border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-mono text-red-200">S1</span>
               <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-mono text-sky-200">S2</span>
               <span className="rounded-md border border-yellow-300/30 bg-yellow-400/10 px-1.5 py-0.5 text-[9px] font-mono text-yellow-100">S3</span>
               <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-mono text-cyan-200">Aero</span>
               <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-mono text-amber-200">OT</span>
            </div>

            {(currentLap !== null || (focusDriver && focusLapElapsed)) && (
               <div className="absolute bottom-1 right-3 z-10 flex items-end gap-2">
                  {focusDriver && focusLapElapsed && (
                     <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-1 backdrop-blur-md">
                        <p className="text-[8px] font-mono uppercase text-center tracking-wider text-f1-silver/60">
                           {focusDriver.name_acronym} · L{focusLapElapsed.lapNumber}
                        </p>
                        <p className="text-lg font-black text-f1-white font-mono leading-tight text-center tabular-nums">
                           {formatLapTime(focusLapElapsed.elapsedSec)}
                        </p>
                     </div>
                  )}
                  {currentLap !== null && (
                     <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-1 backdrop-blur-md">
                        <p className="text-[8px] font-mono uppercase text-center tracking-wider text-f1-silver/60">Lap</p>
                        <p className="text-lg font-black text-f1-white font-mono leading-tight text-center">{currentLap}</p>
                     </div>
                  )}
               </div>
            )}

            <svg viewBox="0 0 500 500" className="h-full w-full" key={circuit.id}>
               <defs>
                  <filter id={`${pathId}-glow`}>
                     <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                     <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                     </feMerge>
                  </filter>
               </defs>

               <path id={pathId} d={circuit.trackPath} fill="none" stroke="transparent" strokeWidth="1" />

               <path d={circuit.trackPath} fill="none" stroke="#020617" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
               <path d={circuit.trackPath} fill="none" stroke="#f8fafc" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${pathId}-glow)`} opacity="0.2" />
               <path d={circuit.trackPath} fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

               <PitLaneOverlay
                  pathId={pathId}
                  pitLane={circuit.pitLane}
                  isReversed={circuit.isReversed}
                  onHover={() => { }}
               />

               {circuit.sectors.map((sector) => (
                  <SectorPath key={sector.id} path={circuit.trackPath} pathId={pathId} sector={sector} active={false} onHover={() => { }} />
               ))}

               {circuit.activeAeroZones.map((zone) => (
                  <ActiveAeroZone key={zone.id} path={circuit.trackPath} pathId={pathId} zone={zone} active={false} onHover={() => { }} />
               ))}

               <DetectionPoint key="detect1" pathId={pathId} point={{ id: 'detect1', label: 'Detect', positionPercent: circuit.overtakeMode.detectionPointPercent }} />

               <SpeedTrapMarker speedTrap={circuit.speedTrap} pathId={pathId} onHover={() => { }} />

               <FinishLineMarker
                  pathId={pathId}
                  positionPercent={circuit.sectors[0].startPercent}
                  onHover={() => { }}
               />

               {circuit.cornerMarkers.map((corner) => (
                  <CornerMarker
                     key={corner.number}
                     corner={corner}
                     pathId={pathId}
                     selected={selectedCorner?.number === corner.number}
                     onHover={() => { }}
                     onSelect={setSelectedCorner}
                  />
               ))}

               {drivers
                  .filter((driver) => !isDriverOutAt(driver.driver_number, currentTime))
                  .map((driver) => {
                     const isSelected = selectedDrivers.includes(driver.driver_number);
                     return (
                        <DriverMarkerOnTrack
                           key={driver.driver_number}
                           driver={driver}
                           isSelected={isSelected}
                           location={driverLocations[driver.driver_number]}
                           projectLocation={projectLocation}
                           onSelect={() => toggleDriverSelection(driver.driver_number)}
                           onHover={handleHover}
                        />
                     );
                  })}
            </svg>

            <AnimatePresence>
               {selectedCorner && (
                  <motion.div
                     key={selectedCorner.number}
                     initial={{ opacity: 0, x: 12 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 12 }}
                     className="pointer-events-none absolute right-3 bottom-1 z-20 w-48 rounded-xl border border-f1-red/30 bg-f1-black/95 p-2.5 shadow-2xl backdrop-blur-md"
                  >
                     <p className="text-[8px] font-mono uppercase tracking-[0.15em] text-f1-red-light">Turn {selectedCorner.number}</p>
                     <h4 className="mt-0.5 text-xs font-display font-bold text-f1-white">{selectedCorner.name}</h4>
                     <div className="mt-1.5 grid grid-cols-3 gap-1 text-center text-[9px]">
                        <div className="rounded bg-white/[0.04] py-1">
                           <p className="text-f1-silver/60 font-mono">Type</p>
                           <p className="font-semibold font-mono text-f1-white">{selectedCorner.type}</p>
                        </div>
                        <div className="rounded bg-white/[0.04] py-1">
                           <p className="text-f1-silver/60 font-mono">Speed</p>
                           <p className="font-semibold font-mono text-f1-white">{selectedCorner.averageSpeedKmh}</p>
                        </div>
                        <div className="rounded bg-white/[0.04] py-1">
                           <p className="text-f1-silver/60 font-mono">Pass</p>
                           <p className="font-semibold font-mono text-f1-white">{selectedCorner.overtakingRating}/10</p>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            <AnimatePresence>
               {hoveredDriver && (() => {
                  const driver = drivers.find((d) => d.driver_number === hoveredDriver);
                  if (!driver) return null;
                  const pitting = getPitReplayPosition(hoveredDriver, currentTime, pits, laps, circuit)?.isPitting ?? false;

                  const index = drivers.findIndex((d) => d.driver_number === hoveredDriver);
                  const raceFraction = getDriverRaceFraction(hoveredDriver, index, currentTime, laps);

                  return (
                     <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute bottom-1 left-3 z-20 w-56 rounded-xl border border-white/10 bg-f1-black/95 p-2.5 shadow-2xl backdrop-blur-md"
                     >
                        <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                           <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }} />
                           <div>
                              <h4 className="text-[11px] font-bold text-f1-white">{driver.full_name}</h4>
                              <p className="text-[9px] font-mono text-f1-silver/60">{driver.team_name}</p>
                           </div>
                        </div>
                        <div className="mt-1.5 space-y-1 text-[10px] font-mono text-f1-silver/60">
                           <div className="flex justify-between">
                              <span>Acronym</span>
                              <span className="font-mono text-f1-white font-semibold">{driver.name_acronym}</span>
                           </div>
                           <div className="flex justify-between">
                              <span>Number</span>
                              <span className="font-mono text-f1-white">#{driver.driver_number}</span>
                           </div>
                           <div className="flex justify-between">
                              <span>Track Lap Progress</span>
                              <span className="font-mono text-f1-white">{raceFraction.toFixed(1)}%</span>
                           </div>
                           {pitting && (
                              <div className="flex justify-between text-amber-300">
                                 <span>Status</span>
                                 <span className="font-mono font-bold">IN PIT LANE</span>
                              </div>
                           )}
                        </div>
                     </motion.div>
                  );
               })()}
            </AnimatePresence>
         </div>

         {/* Docked media player */}
         <div className="border-t border-white/[0.06] bg-f1-abyss/40 px-4 py-3 space-y-2.5 shrink-0">
            <div className="relative group">
               <div className="h-2 w-full bg-white/[0.08] rounded-full cursor-pointer relative">
                  <div className="absolute top-0 left-0 h-full bg-f1-red rounded-full" style={{ width: `${progressPercent}%` }} />
                  <div
                     className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-f1-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                     style={{ left: `calc(${progressPercent}% - 7px)` }}
                  />
                  <input
                     type="range"
                     min="0"
                     max="100"
                     step="0.01"
                     value={progressPercent}
                     onChange={(e) => scrubToPercent(parseFloat(e.target.value))}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
               </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
               <div className="flex items-center justify-between w-full sm:w-auto gap-3 shrink-0">
                  <span className="text-xs text-f1-silver/70 font-mono w-16 shrink-0">
                     {formatElapsed(elapsedMs)}
                  </span>
                  <select
                     value={selectedLap}
                     onChange={(e) => {
                        setSelectedLap(e.target.value);
                        jumpToLap(Number(e.target.value));
                     }}
                     style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
                     className="sm:hidden border border-white/[0.08] rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-f1-red/50 w-24 shrink-0"
                  >
                     <option style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} value="">Lap...</option>
                     {laps
                        .filter((l, idx, self) => self.findIndex((t) => t.lap_number === l.lap_number) === idx)
                        .sort((a, b) => a.lap_number - b.lap_number)
                        .map((l) => (
                           <option style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} key={l.lap_number} value={l.lap_number}>
                              Lap {l.lap_number}
                           </option>
                        ))}
                  </select>
               </div>

               <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                     <button onClick={() => skip(-10)} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-1.5 hover:bg-white/[0.08] transition-all text-f1-white" title="Skip back 10s">
                        <SkipBack className="h-4 w-4" />
                     </button>

                     {isPlaying ? (
                        <button onClick={pause} className="rounded-lg bg-f1-red/10 border border-f1-red/30 p-2 hover:bg-f1-red/20 transition-all text-f1-red-light" title="Pause">
                           <Pause className="h-4.5 w-4.5 fill-current" />
                        </button>
                     ) : (
                        <button onClick={play} className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 hover:bg-emerald-500/20 transition-all text-emerald-400" title="Play">
                           <Play className="h-4.5 w-4.5 fill-current" />
                        </button>
                     )}

                     <button onClick={stop} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-1.5 hover:bg-white/[0.08] transition-all text-f1-white" title="Stop / Reset">
                        <Square className="h-4 w-4" />
                     </button>

                     <button onClick={() => skip(10)} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-1.5 hover:bg-white/[0.08] transition-all text-f1-white" title="Skip forward 10s">
                        <SkipForward className="h-4 w-4" />
                     </button>
                  </div>

                  <div className="flex bg-white/[0.03] border border-white/[0.06] p-1 rounded-lg gap-1 shrink-0">
                     {([1, 2, 4, 8] as const).map((spd) => (
                        <button
                           key={spd}
                           onClick={() => setSpeed(spd)}
                           className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${playbackSpeed === spd ? 'bg-f1-red text-white' : 'text-f1-silver/60 hover:text-f1-white'}`}
                        >
                           {spd}x
                        </button>
                     ))}
                  </div>
               </div>

               <select
                  value={selectedLap}
                  onChange={(e) => {
                     setSelectedLap(e.target.value);
                     jumpToLap(Number(e.target.value));
                  }}
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
                  className="hidden sm:block border border-white/[0.08] rounded-lg px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-f1-red/50 w-20 shrink-0"
               >
                  <option style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} value="">Lap...</option>
                  {laps
                     .filter((l, idx, self) => self.findIndex((t) => t.lap_number === l.lap_number) === idx)
                     .sort((a, b) => a.lap_number - b.lap_number)
                     .map((l) => (
                        <option style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} key={l.lap_number} value={l.lap_number}>
                           Lap {l.lap_number}
                        </option>
                     ))}
               </select>
            </div>
         </div>
      </div>
   );
};
