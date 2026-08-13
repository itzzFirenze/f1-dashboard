import React, { useId, useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import { CircuitData, CircuitCornerMarker } from '../../data/circuits';
import { OpenF1Driver, OpenF1Lap } from '../../services/telemetryService';
import CornerMarker from './CornerMarker';
import ActiveAeroZone from './ActiveAeroZone';
import SectorPath from './SectorPath';
import SpeedTrapMarker from './SpeedTrapMarker';
import FinishLineMarker from './FinishLineMarker';
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

const PitMarkerOffset = 22; // px, perpendicular distance off the centerline

const DriverMarkerOnTrack: React.FC<{
   pathId: string;
   driver: OpenF1Driver;
   percent: number;
   isSelected: boolean;
   isPitting: boolean;
   onSelect: () => void;
   onHover: (driverNo: number | null) => void;
}> = ({ pathId, driver, percent, isSelected, isPitting, onHover, onSelect }) => {
   const pos = usePathPoint(pathId, percent);
   const posAhead = usePathPoint(pathId, (percent + 0.5) % 100); // tiny step forward, to get tangent
   const teamColor = `#${driver.team_colour || 'ffffff'}`;

   // Perpendicular offset so pitting cars render visibly off the racing line
   let drawX = pos.x;
   let drawY = pos.y;
   if (isPitting) {
      const dx = posAhead.x - pos.x;
      const dy = posAhead.y - pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len; // perpendicular unit vector
      const ny = dx / len;
      drawX = pos.x + nx * PitMarkerOffset;
      drawY = pos.y + ny * PitMarkerOffset;
   }

   return (
      <g
         onClick={onSelect}
         onMouseEnter={() => onHover(driver.driver_number)}
         onMouseLeave={() => onHover(null)}
         className="cursor-pointer group"
      >
         {isPitting && (
            <line x1={pos.x} y1={pos.y} x2={drawX} y2={drawY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity={0.6} />
         )}
         {isSelected && (
            <circle cx={drawX} cy={drawY} r="14" fill="transparent" stroke={teamColor} strokeWidth="2"
               className="animate-ping opacity-75 [transform-box:fill-box] [transform-origin:center]" />
         )}
         <circle cx={drawX} cy={drawY} r="9" fill="#0f172a"
            stroke={isPitting ? '#f59e0b' : teamColor} strokeWidth="2"
            strokeDasharray={isPitting ? '2 2' : undefined}
            className="transition-transform duration-300 group-hover:scale-125 [transform-box:fill-box] [transform-origin:center]" />
         <circle cx={drawX} cy={drawY} r="5.5" fill={teamColor}
            className="transition-transform duration-300 group-hover:scale-125 [transform-box:fill-box] [transform-origin:center]" />
         <text x={drawX} y={drawY - 13} textAnchor="middle" fontSize="9" fontWeight="800" fill="#f8fafc"
            className="select-none font-mono filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {driver.name_acronym}
         </text>
         {isPitting && (
            <text x={drawX} y={drawY + 17} textAnchor="middle" fontSize="6" fontWeight="800" fill="#f59e0b" className="select-none font-mono">
               PIT
            </text>
         )}
      </g>
   );
};

const formatElapsed = (ms: number): string => {
   const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
   const hours = Math.floor(totalSeconds / 3600);
   const minutes = Math.floor((totalSeconds % 3600) / 60);
   const seconds = totalSeconds % 60;
   return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
   const lapDurationSec = activeLap.lap_duration && activeLap.lap_duration > 0 ? activeLap.lap_duration : 90;
   const elapsedSec = Math.max(0, (nowMs - lapStartMs) / 1000);

   return Math.min(99.5, Math.max(0, (elapsedSec / lapDurationSec) * 100));
};

const getDriverLapPercent = (
   driverNumber: number,
   index: number,
   currentTime: Date | null,
   laps: OpenF1Lap[],
   startPercent: number,
   isReversed: boolean
): number => {
   const step = (fraction: number) =>
      isReversed ? (startPercent - fraction + 100) % 100 : (startPercent + fraction) % 100;

   const driverLaps = currentTime
      ? laps.filter(
         (l) => l.driver_number === driverNumber && l.date_start && new Date(l.date_start).getTime() <= currentTime.getTime()
      )
      : [];

   if (!currentTime || !laps || laps.length === 0) {
      return step((index * 2.2) % 100);
   }

   if (driverLaps.length === 0) {
      return startPercent;
   }

   const raceFraction = getDriverRaceFraction(driverNumber, index, currentTime, laps);
   return step(raceFraction);
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
   const pathId = useMemo(() => `replay-track-${mapId.replace(/:/g, '')}`, [mapId]);
   const {
      drivers,
      selectedDrivers,
      toggleDriverSelection,
      laps,
      currentTime,
      isDriverOutAt,
      isDriverPittingAt,
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

   useEffect(() => {
      setSelectedLap('');
   }, [activeSession?.session_key]);

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
      <div className="flex flex-col h-[590px] overflow-hidden rounded-2xl border border-white/10 bg-f1-dark-gray/60 shadow-2xl backdrop-blur-md">
         {/* Map area */}
         <div className="relative flex-1 min-h-0 p-3 pb-1">
            {/* HUD Info */}
            <div className="absolute left-3 top-3 z-10 space-y-0.5">
               <h3 className="font-display text-sm font-bold text-f1-white">{circuit.name}</h3>
               <p className="flex items-center gap-1 text-[10px] text-f1-silver">
                  <MapPin className="h-3 w-3 text-f1-red" />
                  {circuit.location}, {circuit.country}
               </p>
            </div>

            {/* HUD Badges */}
            <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1 max-w-[55%]">
               <span className="rounded-md border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-200">S1</span>
               <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-200">S2</span>
               <span className="rounded-md border border-yellow-300/30 bg-yellow-400/10 px-1.5 py-0.5 text-[9px] text-yellow-100">S3</span>
               <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] text-cyan-200">Aero</span>
               <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-200">OT</span>
            </div>

            {(currentLap !== null || (focusDriver && focusLapElapsed)) && (
               <div className="absolute bottom-1 right-3 z-10 flex items-end gap-2">
                  {focusDriver && focusLapElapsed && (
                     <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-1 backdrop-blur-md">
                        <p className="text-[8px] uppercase text-center tracking-wider text-f1-silver">
                           {focusDriver.name_acronym} · L{focusLapElapsed.lapNumber}
                        </p>
                        <p className="text-lg font-black text-f1-white font-mono leading-tight text-center tabular-nums">
                           {formatLapTime(focusLapElapsed.elapsedSec)}
                        </p>
                     </div>
                  )}
                  {currentLap !== null && (
                     <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-1 backdrop-blur-md">
                        <p className="text-[8px] uppercase text-center tracking-wider text-f1-silver">Lap</p>
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
                  .map((driver, index) => {
                     const isSelected = selectedDrivers.includes(driver.driver_number);
                     const isPitting = isDriverPittingAt(driver.driver_number, currentTime);
                     const percent = isPitting
                        ? circuit.sectors[0].startPercent // approx pit entry, near start/finish
                        : getDriverLapPercent(
                           driver.driver_number, index, currentTime, laps,
                           circuit.sectors[0].startPercent, circuit.isReversed
                        );
                     return (
                        <DriverMarkerOnTrack
                           key={driver.driver_number}
                           pathId={pathId}
                           driver={driver}
                           percent={percent}
                           isSelected={isSelected}
                           isPitting={isPitting}
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
                     <p className="text-[8px] uppercase tracking-[0.15em] text-f1-red-light">Turn {selectedCorner.number}</p>
                     <h4 className="mt-0.5 text-xs font-display font-bold text-f1-white">{selectedCorner.name}</h4>
                     <div className="mt-1.5 grid grid-cols-3 gap-1 text-center text-[9px]">
                        <div className="rounded bg-white/[0.04] py-1">
                           <p className="text-f1-silver">Type</p>
                           <p className="font-semibold text-f1-white">{selectedCorner.type}</p>
                        </div>
                        <div className="rounded bg-white/[0.04] py-1">
                           <p className="text-f1-silver">Speed</p>
                           <p className="font-semibold text-f1-white">{selectedCorner.averageSpeedKmh}</p>
                        </div>
                        <div className="rounded bg-white/[0.04] py-1">
                           <p className="text-f1-silver">Pass</p>
                           <p className="font-semibold text-f1-white">{selectedCorner.overtakingRating}/10</p>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            <AnimatePresence>
               {hoveredDriver && (() => {
                  const driver = drivers.find((d) => d.driver_number === hoveredDriver);
                  if (!driver) return null;
                  const pitting = isDriverPittingAt(hoveredDriver, currentTime);

                  const index = drivers.findIndex((d) => d.driver_number === hoveredDriver);
                  const raceFraction = getDriverRaceFraction(hoveredDriver, index, currentTime, laps); // <-- was getDriverLapPercent

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
                              <p className="text-[9px] text-f1-silver">{driver.team_name}</p>
                           </div>
                        </div>
                        <div className="mt-1.5 space-y-1 text-[10px] text-f1-silver">
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
         <div className="border-t border-white/10 bg-black/30 px-4 py-3 space-y-2.5 shrink-0">
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

            <div className="flex items-center justify-between gap-3">
               <span className="text-xs text-f1-silver font-mono w-16 shrink-0">
                  {formatElapsed(elapsedMs)}
               </span>

               <div className="flex items-center gap-1.5">
                  <button onClick={() => skip(-10)} className="rounded-lg bg-white/[0.04] border border-white/5 p-1.5 hover:bg-white/[0.08] transition-all text-f1-white" title="Skip back 10s">
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

                  <button onClick={stop} className="rounded-lg bg-white/[0.04] border border-white/5 p-1.5 hover:bg-white/[0.08] transition-all text-f1-white" title="Stop / Reset">
                     <Square className="h-4 w-4" />
                  </button>

                  <button onClick={() => skip(10)} className="rounded-lg bg-white/[0.04] border border-white/5 p-1.5 hover:bg-white/[0.08] transition-all text-f1-white" title="Skip forward 10s">
                     <SkipForward className="h-4 w-4" />
                  </button>
               </div>

               <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-lg gap-1">
                  {([1, 2, 4, 8] as const).map((spd) => (
                     <button
                        key={spd}
                        onClick={() => setSpeed(spd)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${playbackSpeed === spd ? 'bg-f1-red text-white' : 'text-f1-silver hover:text-f1-white'}`}
                     >
                        {spd}x
                     </button>
                  ))}
               </div>

               <select
                  value={selectedLap}
                  onChange={(e) => {
                     setSelectedLap(e.target.value);
                     jumpToLap(Number(e.target.value));
                  }}
                  className="bg-f1-mid-gray/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-f1-white focus:outline-none w-20 shrink-0"
               >
                  <option value="">Lap...</option>
                  {laps
                     .filter((l, idx, self) => self.findIndex((t) => t.lap_number === l.lap_number) === idx)
                     .sort((a, b) => a.lap_number - b.lap_number)
                     .map((l) => (
                        <option key={l.lap_number} value={l.lap_number}>Lap {l.lap_number}</option>
                     ))}
               </select>
            </div>
         </div>
      </div>
   );
};