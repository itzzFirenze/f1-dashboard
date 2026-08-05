import React, { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flag, Gauge, Info, MapPin, Ruler, Timer, Wind, Zap } from 'lucide-react';
import type { CircuitCornerMarker, CircuitDRSZone, CircuitData, Sector, SpeedTrap } from '../../data/circuits';
import CornerMarker from './CornerMarker';
import ActiveAeroZone from './ActiveAeroZone';
import SectorPath from './SectorPath';
import SpeedTrapMarker from './SpeedTrapMarker';
import { usePathPoint } from './usePathPoint';

interface InteractiveCircuitMapProps {
   circuit: CircuitData;
}

type Tooltip =
   | { kind: 'corner'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'sector'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'aero'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'speed'; title: string; rows: Array<[string, string | number]> }
   | null;

const DetectionPoint: React.FC<{ pathId: string; point: { id: string; label: string; positionPercent: number } }> = ({ pathId, point }) => {
   const position = usePathPoint(pathId, point.positionPercent);
   return (
      <g transform={`translate(${position.x} ${position.y})`}>
         <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" fill="#f59e0b" stroke="#fde68a" strokeWidth="1" />
         <text x="8" y="3" fontSize="7" fill="#fde68a">{point.label}</text>
      </g>
   );
};

const TooltipPanel: React.FC<{ tooltip: Tooltip }> = ({ tooltip }) => {
   if (!tooltip) return null;
   return (
      <div className="pointer-events-none absolute left-4 top-4 z-20 w-64 rounded-lg border border-white/10 bg-f1-black/90 p-3 shadow-2xl backdrop-blur-md">
         <p className="text-sm font-semibold text-f1-white">{tooltip.title}</p>
         <div className="mt-2 space-y-1">
            {tooltip.rows.map(([label, value]) => (
               <div key={label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-f1-silver">{label}</span>
                  <span className="text-right font-medium text-f1-white">{value}</span>
               </div>
            ))}
         </div>
      </div>
   );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
   <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center gap-2 text-f1-silver">{icon}<span className="text-xs uppercase tracking-wide">{label}</span></div>
      <p className="text-lg font-bold text-f1-white">{value}</p>
   </div>
);

const InteractiveCircuitMap: React.FC<InteractiveCircuitMapProps> = ({ circuit }) => {
   const rawPathId = useId();
   const pathId = useMemo(() => `track-${rawPathId.replace(/:/g, '')}`, [rawPathId]);
   const [selectedCorner, setSelectedCorner] = useState<CircuitCornerMarker | null>(circuit.cornerMarkers[0] ?? null);
   const [hoveredSector, setHoveredSector] = useState<Sector | null>(null);
   const [hoveredZone, setHoveredZone] = useState<CircuitDRSZone | null>(null);
   const [tooltip, setTooltip] = useState<Tooltip>(null);

   const handleCornerHover = (corner: CircuitCornerMarker | null) => {
      setTooltip(corner && {
         kind: 'corner',
         title: `Turn ${corner.number}: ${corner.name}`,
         rows: [['Type', corner.type], ['Overtaking', corner.overtakingDifficulty], ['Avg speed', `${corner.averageSpeedKmh} km/h`]],
      });
   };

   const handleSectorHover = (sector: Sector | null) => {
      setHoveredSector(sector);
      setTooltip(sector && {
         kind: 'sector',
         title: sector.name,
         rows: [['Length', `${sector.lengthKm} km`], ['Average speed', `${sector.averageSpeedKmh} km/h`], ['Fastest holder', sector.fastestSectorHolder]],
      });
   };

   const handleZoneHover = (zone: CircuitDRSZone | null) => {
      setHoveredZone(zone);
      setTooltip(zone && {
         kind: 'aero',
         title: `Active Aero — ${zone.label}`,
         rows: [['Start', `${zone.startPercent}% lap`], ['End', `${zone.endPercent}% lap`], ['Overtake detection', zone.detectionPointId]],
      });
   };

   const handleSpeedTrapHover = (speedTrap: SpeedTrap | null) => {
      setTooltip(speedTrap && {
         kind: 'speed',
         title: 'Speed Trap',
         rows: [['Location', speedTrap.location], ['Historical top', `${speedTrap.historicalTopSpeedKmh} km/h`], ['Fastest', `${speedTrap.fastestRecordedSpeedKmh} km/h`]],
      });
   };

   return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
         <motion.div
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02))] p-3 shadow-2xl"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            key={circuit.id}
         >
            <TooltipPanel tooltip={tooltip} />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
               <div>
                  <h2 className="text-2xl font-display font-bold">{circuit.name}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-f1-silver"><MapPin className="h-4 w-4 text-f1-red" />{circuit.location}, {circuit.country}</p>
               </div>
               <div className="flex flex-wrap gap-2 text-xs text-f1-silver">
                  <span className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 text-red-200">S1</span>
                  <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-sky-200">S2</span>
                  <span className="rounded-md border border-yellow-300/30 bg-yellow-400/10 px-2 py-1 text-yellow-100">S3</span>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-200">Active Aero</span>
                  <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-amber-200">Overtake</span>
               </div>
            </div>

            <svg viewBox={circuit.viewBox} role="img" aria-label={`${circuit.name} interactive circuit map`} className="h-[420px] w-full sm:h-[560px]">
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
               <path d={circuit.trackPath} fill="none" stroke="#020617" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round" />
               <path d={circuit.trackPath} fill="none" stroke="#f8fafc" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${pathId}-glow)`} opacity="0.85" />
               <path d={circuit.trackPath} fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

               {circuit.sectors.map((sector) => (
                  <SectorPath key={sector.id} path={circuit.trackPath} sector={sector} active={hoveredSector?.id === sector.id} onHover={handleSectorHover} />
               ))}
               {circuit.drsZonesData.map((zone) => (
                  <ActiveAeroZone key={zone.id} path={circuit.trackPath} zone={zone} active={hoveredZone?.id === zone.id} onHover={handleZoneHover} />
               ))}
               {circuit.drsDetectionPoints.map((point) => <DetectionPoint key={point.id} pathId={pathId} point={point} />)}
               <SpeedTrapMarker speedTrap={circuit.speedTrap} pathId={pathId} onHover={handleSpeedTrapHover} />
               {circuit.cornerMarkers.map((corner) => (
                  <CornerMarker key={corner.number} corner={corner} pathId={pathId} selected={selectedCorner?.number === corner.number} onHover={handleCornerHover} onSelect={setSelectedCorner} />
               ))}
            </svg>
         </motion.div>

         <aside className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-f1-dark-gray/80 p-4 shadow-xl backdrop-blur-md">
               <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Info className="h-5 w-5 text-f1-red" />Circuit Statistics</h3>
               <div className="grid grid-cols-2 gap-3">
                  <Stat icon={<Ruler className="h-4 w-4 text-f1-red" />} label="Length" value={`${circuit.lengthKm} km`} />
                  <Stat icon={<Flag className="h-4 w-4 text-emerald-300" />} label="Race" value={`${circuit.raceDistanceKm} km`} />
                  <Stat icon={<Activity className="h-4 w-4 text-sky-300" />} label="Laps" value={circuit.laps} />
                  <Stat icon={<Zap className="h-4 w-4 text-yellow-200" />} label="Corners" value={circuit.corners} />
                  <Stat icon={<Wind className="h-4 w-4 text-cyan-300" />} label="Active Aero" value={circuit.drsZones} />
                  <Stat icon={<Timer className="h-4 w-4 text-purple-300" />} label="Record" value={circuit.lapRecord} />
               </div>
               <p className="mt-3 text-xs text-f1-silver">Lap record: {circuit.lapRecordHolder}</p>
               <p className="mt-2 flex items-center gap-1.5 text-xs text-f1-silver"><Gauge className="h-3.5 w-3.5 text-purple-300" />Boost Mode: available anywhere on track, every lap.</p>
            </div>

            {selectedCorner && (
               <motion.div
                  className="rounded-xl border border-f1-red/30 bg-f1-dark-gray/90 p-5 shadow-2xl shadow-f1-red/10 backdrop-blur-md"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22 }}
                  key={`${circuit.id}-${selectedCorner.number}`}
               >
                  <p className="text-xs uppercase tracking-[0.2em] text-f1-red-light">Selected corner</p>
                  <h3 className="mt-2 text-2xl font-display font-bold">{selectedCorner.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-f1-silver">{selectedCorner.description}</p>
                  <div className="mt-4 space-y-3">
                     <div>
                        <p className="text-xs uppercase tracking-wide text-f1-silver">Racing line</p>
                        <p className="mt-1 text-sm text-f1-white">{selectedCorner.racingLine}</p>
                     </div>
                     <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-white/[0.04] p-2"><p className="text-xs text-f1-silver">Braking</p><p className="font-semibold">{selectedCorner.brakingDifficulty}</p></div>
                        <div className="rounded-lg bg-white/[0.04] p-2"><p className="text-xs text-f1-silver">Avg speed</p><p className="font-semibold">{selectedCorner.averageSpeedKmh}</p></div>
                        <div className="rounded-lg bg-white/[0.04] p-2"><p className="text-xs text-f1-silver">Pass rating</p><p className="font-semibold">{selectedCorner.overtakingRating}/10</p></div>
                     </div>
                  </div>
               </motion.div>
            )}
         </aside>
      </div>
   );
};

export default InteractiveCircuitMap;