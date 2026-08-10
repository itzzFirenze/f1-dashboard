import React, { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Compass } from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import { CircuitData, CircuitCornerMarker } from '../../data/circuits';
import { OpenF1Driver, OpenF1Lap } from '../../services/telemetryService';
import CornerMarker from './CornerMarker';
import ActiveAeroZone from './ActiveAeroZone';
import SectorPath from './SectorPath';
import SpeedTrapMarker from './SpeedTrapMarker';
import { usePathPoint } from './usePathPoint';

interface InteractiveReplayMapProps {
   circuit: CircuitData;
}

/** Small detection-point marker identical to the one in InteractiveCircuitMap */
const DetectionPoint: React.FC<{ pathId: string; point: { id: string; label: string; positionPercent: number } }> = ({ pathId, point }) => {
   const position = usePathPoint(pathId, point.positionPercent);
   return (
      <g transform={`translate(${position.x} ${position.y})`}>
         <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" fill="#f59e0b" stroke="#fde68a" strokeWidth="1" />
         <text x="8" y="3" fontSize="7" fill="#fde68a">{point.label}</text>
      </g>
   );
};

/** Driver marker placed directly on the SVG track path using path percentage */
const DriverMarkerOnTrack: React.FC<{
   pathId: string;
   driver: OpenF1Driver;
   percent: number;
   isSelected: boolean;
   onSelect: () => void;
   onHover: (driverNo: number | null) => void;
}> = ({ pathId, driver, percent, isSelected, onHover, onSelect }) => {
   const pos = usePathPoint(pathId, percent);
   const teamColor = `#${driver.team_colour || 'ffffff'}`;

   return (
      <g
         onClick={onSelect}
         onMouseEnter={() => onHover(driver.driver_number)}
         onMouseLeave={() => onHover(null)}
         className="cursor-pointer group"
      >
         {isSelected && (
            <circle
               cx={pos.x}
               cy={pos.y}
               r="14"
               fill="transparent"
               stroke={teamColor}
               strokeWidth="2"
               className="animate-ping opacity-75"
            />
         )}

         {/* Outer dot outline */}
         <circle
            cx={pos.x}
            cy={pos.y}
            r="9"
            fill="#0f172a"
            stroke={teamColor}
            strokeWidth="2"
            className="transition-all duration-300 group-hover:scale-125"
         />

         {/* Inner driver team color fill */}
         <circle
            cx={pos.x}
            cy={pos.y}
            r="5.5"
            fill={teamColor}
            className="transition-all duration-300 group-hover:scale-125"
         />

         {/* Mini Driver Label Text */}
         <text
            x={pos.x}
            y={pos.y - 13}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#f8fafc"
            className="select-none font-mono filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
         >
            {driver.name_acronym}
         </text>
      </g>
   );
};

/** Calculates a driver's lap completion percentage for SVG track path positioning */
const getDriverLapPercent = (
   driverNumber: number,
   index: number,
   currentTime: Date | null,
   laps: OpenF1Lap[]
): number => {
   if (!currentTime || !laps || laps.length === 0) {
      return (100 - (index * 2.2)) % 100;
   }

   const nowMs = currentTime.getTime();
   const driverLaps = laps.filter(
      (l) => l.driver_number === driverNumber && l.date_start && new Date(l.date_start).getTime() <= nowMs
   );

   if (driverLaps.length === 0) {
      return (100 - (index * 2.2)) % 100;
   }

   // Active lap (most recent lap started)
   const activeLap = driverLaps.reduce((latest, l) => {
      return new Date(l.date_start!).getTime() > new Date(latest.date_start!).getTime() ? l : latest;
   }, driverLaps[0]);

   const lapStartMs = new Date(activeLap.date_start!).getTime();
   const lapDurationSec = activeLap.lap_duration && activeLap.lap_duration > 0 ? activeLap.lap_duration : 90;
   const elapsedSec = Math.max(0, (nowMs - lapStartMs) / 1000);

   const percent = Math.min(99.5, Math.max(0, (elapsedSec / lapDurationSec) * 100));
   return percent;
};

export const InteractiveReplayMap: React.FC<InteractiveReplayMapProps> = ({ circuit }) => {
   const mapId = useId();
   const pathId = useMemo(() => `replay-track-${mapId.replace(/:/g, '')}`, [mapId]);
   const { driverLocations, drivers, selectedDrivers, toggleDriverSelection, laps, currentTime } = useReplay();

   const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);
   const [selectedCorner, setSelectedCorner] = useState<CircuitCornerMarker | null>(null);

   // Compute bounding box of active location samples to calibrate projection matrix if telemetry location data exists
   const projection = useMemo(() => {
      const locations = Object.values(driverLocations);
      if (locations.length === 0) {
         return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
      }

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      locations.forEach((loc) => {
         if (loc.x < minX) minX = loc.x;
         if (loc.x > maxX) maxX = loc.x;
         if (loc.y < minY) minY = loc.y;
         if (loc.y > maxY) maxY = loc.y;
      });

      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;

      const padding = 60;
      const targetWidth = 500 - padding * 2;
      const targetHeight = 500 - padding * 2;
      const scale = Math.min(targetWidth / rangeX, targetHeight / rangeY);

      return {
         scaleX: scale,
         scaleY: -scale, // Invert Y as F1 telemetry coordinates typically have Y pointing up, SVGs have Y pointing down
         offsetX: 250 - ((minX + maxX) / 2) * scale,
         offsetY: 250 + ((minY + maxY) / 2) * scale,
      };
   }, [driverLocations]);

   // Project telemetry coordinates to SVG space
   const project = (x: number, y: number) => ({
      x: x * projection.scaleX + projection.offsetX,
      y: y * projection.scaleY + projection.offsetY,
   });

   return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-f1-dark-gray/60 p-4 shadow-2xl backdrop-blur-md">
         {/* HUD Info */}
         <div className="absolute left-4 top-4 z-10 space-y-1">
            <h3 className="font-display text-lg font-bold text-f1-white">{circuit.name}</h3>
            <p className="flex items-center gap-1.5 text-xs text-f1-silver">
               <MapPin className="h-3.5 w-3.5 text-f1-red" />
               {circuit.location}, {circuit.country}
            </p>
         </div>

         {/* HUD Badges */}
         <div className="absolute right-4 top-4 z-10 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-f1-silver flex items-center gap-1">
               <Compass className="h-3 w-3 text-f1-red" /> Live Driver Trackers ({drivers.length})
            </span>
            <span className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-200">S1</span>
            <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-200">S2</span>
            <span className="rounded-md border border-yellow-300/30 bg-yellow-400/10 px-2 py-1 text-[10px] text-yellow-100">S3</span>
            <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-200">Active Aero</span>
            <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-200">Overtake</span>
         </div>

         {/* SVG Circuit Visualizer — key on circuit.id forces re-mount when circuit changes */}
         <svg viewBox="0 0 500 500" className="h-[480px] w-full sm:h-[580px]" key={circuit.id}>
            {/* Glow & Track Shadows */}
            <defs>
               <filter id={`${pathId}-glow`}>
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                     <feMergeNode in="coloredBlur" />
                     <feMergeNode in="SourceGraphic" />
                  </feMerge>
               </filter>
            </defs>

            {/* Hidden reference path for usePathPoint — needs an id so getElementById works */}
            <path id={pathId} d={circuit.trackPath} fill="none" stroke="transparent" strokeWidth="1" />

            {/* Track outline layers */}
            <path
               d={circuit.trackPath}
               fill="none"
               stroke="#020617"
               strokeWidth="18"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
            <path
               d={circuit.trackPath}
               fill="none"
               stroke="#f8fafc"
               strokeWidth="10"
               strokeLinecap="round"
               strokeLinejoin="round"
               filter={`url(#${pathId}-glow)`}
               opacity="0.2"
            />
            <path
               d={circuit.trackPath}
               fill="none"
               stroke="#1e293b"
               strokeWidth="6"
               strokeLinecap="round"
               strokeLinejoin="round"
            />

            {/* Sector Highlights */}
            {circuit.sectors.map((sector) => (
               <SectorPath key={sector.id} path={circuit.trackPath} pathId={pathId} sector={sector} active={false} onHover={() => { }} />
            ))}

            {/* Active Aero */}
            {circuit.activeAeroZones.map((zone) => (
               <ActiveAeroZone key={zone.id} path={circuit.trackPath} pathId={pathId} zone={zone} active={false} onHover={() => { }} />
            ))}

            {/* Overtake Detection Point */}
            <DetectionPoint key="detect1" pathId={pathId} point={{ id: 'detect1', label: 'Detect', positionPercent: circuit.overtakeMode.detectionPointPercent }} />

            {/* Speed Trap Marker */}
            <SpeedTrapMarker speedTrap={circuit.speedTrap} pathId={pathId} onHover={() => { }} />

            {/* Corner Markers */}
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

            {/* Render Driver Markers */}
            {drivers.map((driver, index) => {
               const loc = driverLocations[driver.driver_number];
               const isSelected = selectedDrivers.includes(driver.driver_number);
               const teamColor = `#${driver.team_colour || 'ffffff'}`;

               // 1. If raw telemetry GPS location is present, project it
               if (loc && loc.x !== undefined && loc.y !== undefined && Object.keys(driverLocations).length > 0) {
                  const pos = project(loc.x, loc.y);
                  return (
                     <g
                        key={driver.driver_number}
                        onClick={() => toggleDriverSelection(driver.driver_number)}
                        onMouseEnter={() => setHoveredDriver(driver.driver_number)}
                        onMouseLeave={() => setHoveredDriver(null)}
                        className="cursor-pointer group"
                     >
                        {isSelected && (
                           <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="14"
                              fill="transparent"
                              stroke={teamColor}
                              strokeWidth="2"
                              className="animate-ping opacity-75"
                           />
                        )}
                        <circle
                           cx={pos.x}
                           cy={pos.y}
                           r="9"
                           fill="#0f172a"
                           stroke={teamColor}
                           strokeWidth="2"
                           className="transition-all duration-300 group-hover:scale-125"
                        />
                        <circle
                           cx={pos.x}
                           cy={pos.y}
                           r="5.5"
                           fill={teamColor}
                           className="transition-all duration-300 group-hover:scale-125"
                        />
                        <text
                           x={pos.x}
                           y={pos.y - 13}
                           textAnchor="middle"
                           fontSize="9"
                           fontWeight="800"
                           fill="#f8fafc"
                           className="select-none font-mono filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                        >
                           {driver.name_acronym}
                        </text>
                     </g>
                  );
               }

               // 2. Fallback: Position driver along the SVG track path based on lap timing progress
               const percent = getDriverLapPercent(driver.driver_number, index, currentTime, laps);

               return (
                  <DriverMarkerOnTrack
                     key={driver.driver_number}
                     pathId={pathId}
                     driver={driver}
                     percent={percent}
                     isSelected={isSelected}
                     onSelect={() => toggleDriverSelection(driver.driver_number)}
                     onHover={setHoveredDriver}
                  />
               );
            })}
         </svg>

         {/* Selected Corner Info Badge */}
         <AnimatePresence>
            {selectedCorner && (
               <motion.div
                  key={selectedCorner.number}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="pointer-events-none absolute right-4 bottom-4 z-20 w-56 rounded-xl border border-f1-red/30 bg-f1-black/95 p-3 shadow-2xl backdrop-blur-md"
               >
                  <p className="text-[9px] uppercase tracking-[0.15em] text-f1-red-light">Turn {selectedCorner.number}</p>
                  <h4 className="mt-1 text-sm font-display font-bold text-f1-white">{selectedCorner.name}</h4>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px]">
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

         {/* Interactive Driver Tooltip Panel */}
         <AnimatePresence>
            {hoveredDriver && (() => {
               const driver = drivers.find((d) => d.driver_number === hoveredDriver);
               const loc = driverLocations[hoveredDriver];
               const index = drivers.findIndex((d) => d.driver_number === hoveredDriver);
               const percent = getDriverLapPercent(hoveredDriver, Math.max(0, index), currentTime, laps);

               if (!driver) return null;

               return (
                  <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="pointer-events-none absolute bottom-4 left-4 z-20 w-64 rounded-xl border border-white/10 bg-f1-black/95 p-3 shadow-2xl backdrop-blur-md"
                  >
                     <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <div
                           className="h-3 w-3 rounded-full"
                           style={{ backgroundColor: `#${driver.team_colour}` }}
                        />
                        <div>
                           <h4 className="text-xs font-bold text-f1-white">{driver.full_name}</h4>
                           <p className="text-[10px] text-f1-silver">{driver.team_name}</p>
                        </div>
                     </div>
                     <div className="mt-2 space-y-1 text-[11px] text-f1-silver">
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
                           <span className="font-mono text-f1-white">{percent.toFixed(1)}%</span>
                        </div>
                        {loc && (
                           <>
                              <div className="flex justify-between">
                                 <span>X Coordinate</span>
                                 <span className="font-mono text-f1-white">{loc.x.toFixed(1)} m</span>
                              </div>
                              <div className="flex justify-between">
                                 <span>Y Coordinate</span>
                                 <span className="font-mono text-f1-white">{loc.y.toFixed(1)} m</span>
                              </div>
                           </>
                        )}
                     </div>
                  </motion.div>
               );
            })()}
         </AnimatePresence>
      </div>
   );
};

