import React, { useId, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Flag, Info, MapPin, Ruler, Timer, Wind, Zap, Sparkles, Shuffle, BookOpen, Compass, Radio } from 'lucide-react';
import type { CircuitCornerMarker, CircuitData, Sector, SpeedTrap, ActiveAeroZone as ActiveAeroZoneType } from '../../data/circuits';
import { CIRCUIT_FACTS, CircuitFact } from '../../data/circuits/circuitFacts';
import CornerMarker from './CornerMarker';
import ActiveAeroZone from './ActiveAeroZone';
import SectorPath from './SectorPath';
import SpeedTrapMarker from './SpeedTrapMarker';
import { usePathPoint } from './usePathPoint';
import FinishLineMarker from './FinishLineMarker';
import PitLaneOverlay from './PitLaneOverlay';

interface InteractiveCircuitMapProps {
   circuit: CircuitData;
}

type Tooltip =
   | { kind: 'corner'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'sector'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'pitlane'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'aero'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'overtake'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'speed'; title: string; rows: Array<[string, string | number]> }
   | { kind: 'finish'; title: string; rows: Array<[string, string | number]> }
   | null;

const OvertakePointMarker: React.FC<{
   pathId: string;
   positionPercent: number;
   color: string;
   label: string;
   onHover: (hovered: boolean) => void;
}> = ({ pathId, positionPercent, color, label, onHover }) => {
   const position = usePathPoint(pathId, positionPercent);
   return (
      <g
         transform={`translate(${position.x} ${position.y})`}
         className="cursor-pointer"
         onMouseEnter={() => onHover(true)}
         onMouseLeave={() => onHover(false)}
      >
         <rect x="-5" y="-5" width="10" height="10" rx="2" fill={color} stroke="#fde68a" strokeWidth="1.5" />
         <text x="9" y="3.5" fontSize="8" fontWeight="bold" fill="#fde68a">{label}</text>
      </g>
   );
};

const TooltipPanel: React.FC<{ tooltip: Tooltip }> = ({ tooltip }) => {
   if (!tooltip) return null;
   return (
      <div className="pointer-events-none absolute left-4 top-28 sm:top-32 z-30 w-64 rounded-xl border border-white/[0.08] bg-f1-carbon/95 p-3.5 shadow-2xl backdrop-blur-xl animate-fade-in">
         <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/[0.06]">
            <Radio className="w-3 h-3 text-f1-red" />
            <p className="text-[11px] font-mono font-bold text-f1-white uppercase tracking-widest">{tooltip.title}</p>
         </div>
         <div className="space-y-1.5">
            {tooltip.rows.map(([label, value]) => (
               <div key={label} className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-f1-silver/50 uppercase tracking-wide">{label}</span>
                  <span className="text-right font-semibold text-f1-white">{value}</span>
               </div>
            ))}
         </div>
      </div>
   );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number; colorHex: string }> = ({ icon, label, value, colorHex }) => (
   <div className="telemetry-chip rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 flex items-center justify-between gap-2 hover:border-white/[0.12] transition-colors">
      <div className="flex items-center gap-2 min-w-0">
         <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-white/[0.06]"
            style={{ backgroundColor: `${colorHex}15` }}
         >
            {icon}
         </div>
         <span className="text-f1-silver/60 text-[10px] uppercase font-mono font-bold tracking-wider truncate">
            {label}
         </span>
      </div>
      <p className="text-xs md:text-sm font-black text-f1-white font-mono shrink-0">{value}</p>
   </div>
);

const TAG_COLORS: Record<CircuitFact['tag'], string> = {
   'Iconic Moment': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
   'Track Quirk': 'bg-sky-500/10 text-sky-300 border-sky-500/30',
   'Driving Challenge': 'bg-f1-red/10 text-f1-red-light border-f1-red/30',
   'Historical Lore': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
   Engineering: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

const TAG_ACCENT: Record<CircuitFact['tag'], string> = {
   'Iconic Moment': '#f59e0b',
   'Track Quirk': '#38bdf8',
   'Driving Challenge': '#E10600',
   'Historical Lore': '#a855f7',
   Engineering: '#10b981',
};

const InteractiveCircuitMap: React.FC<InteractiveCircuitMapProps> = ({ circuit }) => {
   const rawPathId = useId();
   const pathId = useMemo(() => `track-${rawPathId.replace(/:/g, '')}`, [rawPathId]);
   const [hoveredSector, setHoveredSector] = useState<Sector | null>(null);
   const [hoveredZone, setHoveredZone] = useState<ActiveAeroZoneType | null>(null);
   const [tooltip, setTooltip] = useState<Tooltip>(null);
   const [computedViewBox, setComputedViewBox] = useState<string>(circuit.viewBox || '0 0 500 500');
   const pathRef = React.useRef<SVGPathElement | null>(null);

   // Circuit Facts State & Auto-Rotation
   const [factIndex, setFactIndex] = useState<number>(0);
   const [isFactHovered, setIsFactHovered] = useState<boolean>(false);

   const circuitFacts = useMemo(() => {
      return (
         CIRCUIT_FACTS[circuit.id] || [
            {
               id: 'gen-1',
               tag: 'Historical Lore',
               title: `${circuit.name} Heritage`,
               description: `Located in ${circuit.location}, ${circuit.country}, this circuit tests teams across ${circuit.laps} laps with ${circuit.corners} corners.`,
            },
         ]
      );
   }, [circuit.id, circuit.name, circuit.location, circuit.country, circuit.laps, circuit.corners]);

   const currentFact = circuitFacts[factIndex % circuitFacts.length];

   useEffect(() => {
      setFactIndex(0);
   }, [circuit.id]);

   // Auto-rotate facts every 7.5 seconds (paused when user hovers to read)
   useEffect(() => {
      if (circuitFacts.length <= 1 || isFactHovered) return;

      const interval = setInterval(() => {
         setFactIndex((prev) => (prev + 1) % circuitFacts.length);
      }, 7500);

      return () => clearInterval(interval);
   }, [circuitFacts.length, isFactHovered, circuit.id]);

   // Dynamically calculate tight bounding box to maximize every circuit's size
   useEffect(() => {
      const calculateBBox = () => {
         if (pathRef.current) {
            try {
               const bbox = pathRef.current.getBBox();
               if (bbox.width > 10 && bbox.height > 10) {
                  const marginX = Math.max(28, bbox.width * 0.08);
                  const marginY = Math.max(28, bbox.height * 0.08);
                  const x = Math.floor(bbox.x - marginX);
                  const y = Math.floor(bbox.y - marginY);
                  const width = Math.ceil(bbox.width + marginX * 2);
                  const height = Math.ceil(bbox.height + marginY * 2);
                  setComputedViewBox(`${x} ${y} ${width} ${height}`);
               }
            } catch (e) {
               setComputedViewBox(circuit.viewBox || '0 0 500 500');
            }
         }
      };

      calculateBBox();
      const timer = setTimeout(calculateBBox, 50);
      return () => clearTimeout(timer);
   }, [circuit.id, circuit.trackPath, pathId]);

   const handleNextFact = () => {
      setFactIndex((prev) => (prev + 1) % circuitFacts.length);
   };

   const handlePitLaneHover = (hovered: boolean) => {
      setTooltip(
         hovered
            ? {
               kind: 'pitlane',
               title: 'Pit Lane',
               rows: [
                  ['Speed limit', `${circuit.pitLane.speedLimitKmh} km/h`],
                  ['Side', 'Right of racing line'],
               ],
            }
            : null
      );
   };

   const handleFinishLineHover = (hovered: boolean) => {
      setTooltip(
         hovered
            ? {
               kind: 'finish',
               title: 'Start / Finish Line',
               rows: [
                  ['Lap timing', 'Official timing loop'],
                  ['Grid formation', 'Cars line up ahead of line'],
               ],
            }
            : null
      );
   };

   const handleCornerHover = (corner: CircuitCornerMarker | null) => {
      setTooltip(
         corner && {
            kind: 'corner',
            title: `Turn ${corner.number}: ${corner.name}`,
            rows: [
               ['Corner Type', corner.type],
               ['Track Position', `${corner.positionPercent}%`],
            ],
         }
      );
   };

   const handleSectorHover = (sector: Sector | null) => {
      setHoveredSector(sector);
      setTooltip(
         sector && {
            kind: 'sector',
            title: sector.name,
            rows: [
               ['Length', `${sector.lengthKm} km`],
               ['Avg speed', `${sector.averageSpeedKmh} km/h`],
            ],
         }
      );
   };

   const handleZoneHover = (zone: ActiveAeroZoneType | null) => {
      setHoveredZone(zone);
      setTooltip(
         zone && {
            kind: 'aero',
            title: `Active Aero — ${zone.label}`,
            rows: [
               ['Start', `${zone.startPercent}% lap`],
               ['End', `${zone.endPercent}% lap`],
               ['Mode', 'Straight Mode (Available every lap)'],
            ],
         }
      );
   };

   const handleOvertakeHover = (kind: 'detection' | 'activation' | false) => {
      setTooltip(
         kind === 'detection'
            ? {
               kind: 'overtake',
               title: 'Overtake Detection Point',
               rows: [
                  ['Trigger', 'Within 1.0s of car ahead'],
                  ['Deployment', 'Available in activation zone'],
               ],
            }
            : kind === 'activation'
               ? {
                  kind: 'overtake',
                  title: 'Overtake Activation Zone',
                  rows: [
                     ['Effect', 'Deploy active boost / overtake'],
                     ['Requirement', 'Valid detection beforehand'],
                  ],
               }
               : null
      );
   };

   const handleSpeedTrapHover = (speedTrap: SpeedTrap | null) => {
      setTooltip(
         speedTrap && {
            kind: 'speed',
            title: 'Speed Trap Telemetry',
            rows: [
               ['Location', speedTrap.location],
               ['Historical top', `${speedTrap.historicalTopSpeedKmh} km/h`],
               ['Fastest recorded', `${speedTrap.fastestRecordedSpeedKmh} km/h`],
            ],
         }
      );
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] xl:grid-cols-[1fr_370px] gap-4 items-stretch h-full min-h-0 overflow-hidden animate-fade-in">
         {/* Main Large Circuit Map Stage — Mission Control HUD styling to match dashboard hero */}
         <motion.div
            className="telemetry-card dot-grid relative flex flex-col justify-between overflow-hidden p-4 sm:p-5 shadow-2xl h-full min-h-0"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            key={circuit.id}
         >
            {/* Scanline texture + ambient glows, matching dashboard hero */}
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-600/[0.06] rounded-full blur-3xl pointer-events-none" />

            <TooltipPanel tooltip={tooltip} />

            {/* Top Circuit Title & Legend Bar */}
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-3 flex-shrink-0">
               <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <span className="text-f1-red-light text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                        Track Telemetry
                     </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-display font-black text-f1-white uppercase tracking-tight leading-tight">
                     {circuit.name}
                  </h2>
                  <p className="text-xs text-f1-silver font-mono flex items-center gap-2">
                     <Compass className="h-3.5 w-3.5 text-f1-red shrink-0" />
                     <span>{circuit.location}</span>
                     <span className="text-f1-silver/30">|</span>
                     <span className="text-f1-white font-semibold">{circuit.country}</span>
                  </p>
               </div>

               {/* Sector & Aero Legend Pills */}
               <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold">
                  <span className="rounded-md border border-f1-red/30 bg-f1-red/10 px-2 py-0.5 text-f1-red-light uppercase tracking-wider">Sector 1</span>
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-300 uppercase tracking-wider">Sector 2</span>
                  <span className="rounded-md border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-yellow-200 uppercase tracking-wider">Sector 3</span>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-cyan-200 uppercase tracking-wider">Active Aero</span>
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-200 uppercase tracking-wider">DRS</span>
               </div>
            </div>

            {/* SVG Track Map Canvas */}
            <div className="relative z-10 flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden my-1">
               <svg
                  viewBox={computedViewBox}
                  role="img"
                  aria-label={`${circuit.name} interactive circuit map`}
                  className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all duration-300"
               >
                  <defs>
                     <filter id={`${pathId}-glow`}>
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                           <feMergeNode in="coloredBlur" />
                           <feMergeNode in="SourceGraphic" />
                        </feMerge>
                     </filter>
                  </defs>
                  <path ref={pathRef} id={pathId} d={circuit.trackPath} fill="none" stroke="transparent" strokeWidth="1" />
                  <path d={circuit.trackPath} fill="none" stroke="#020617" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                     d={circuit.trackPath}
                     fill="none"
                     stroke="#f8fafc"
                     strokeWidth="14"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     filter={`url(#${pathId}-glow)`}
                     opacity="0.9"
                  />
                  <path d={circuit.trackPath} fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

                  {circuit.sectors.map((sector) => (
                     <SectorPath
                        key={sector.id}
                        path={circuit.trackPath}
                        pathId={pathId}
                        sector={sector}
                        active={hoveredSector?.id === sector.id}
                        onHover={handleSectorHover}
                     />
                  ))}
                  {circuit.activeAeroZones.map((zone) => (
                     <ActiveAeroZone
                        key={zone.id}
                        path={circuit.trackPath}
                        pathId={pathId}
                        zone={zone}
                        active={hoveredZone?.id === zone.id}
                        onHover={handleZoneHover}
                     />
                  ))}

                  <OvertakePointMarker
                     pathId={pathId}
                     positionPercent={circuit.overtakeMode.detectionPointPercent}
                     color="#f59e0b"
                     label="Overtake Detection"
                     onHover={(hovered) => handleOvertakeHover(hovered ? 'detection' : false)}
                  />
                  <OvertakePointMarker
                     pathId={pathId}
                     positionPercent={circuit.overtakeMode.activationPointPercent}
                     color="#4ade80"
                     label="Overtake Activation"
                     onHover={(hovered) => handleOvertakeHover(hovered ? 'activation' : false)}
                  />

                  <SpeedTrapMarker speedTrap={circuit.speedTrap} pathId={pathId} onHover={handleSpeedTrapHover} />
                  {circuit.cornerMarkers.map((corner) => (
                     <CornerMarker
                        key={corner.number}
                        corner={corner}
                        pathId={pathId}
                        selected={false}
                        onHover={handleCornerHover}
                        onSelect={() => { }}
                     />
                  ))}

                  <PitLaneOverlay pathId={pathId} pitLane={circuit.pitLane} isReversed={circuit.isReversed} onHover={handlePitLaneHover} />

                  <FinishLineMarker
                     pathId={pathId}
                     positionPercent={circuit.sectors[0].startPercent}
                     onHover={handleFinishLineHover}
                  />
               </svg>
            </div>

            {/* Bottom Track Meta Footer */}
            <div className="relative z-10 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs bg-white/[0.03] px-3 py-2 rounded-xl flex-shrink-0">
               <div className="flex items-center gap-2 font-mono">
                  <span className="text-f1-silver/60 uppercase tracking-wider text-[10px] font-bold">Lap Record</span>
                  <span className="text-f1-white font-bold">{circuit.lapRecord}</span>
                  <span className="text-f1-silver/40">({circuit.lapRecordHolder})</span>
               </div>
               <div className="flex items-center gap-1.5 text-f1-silver/40 text-[10px] font-mono uppercase tracking-wider">
                  <span>Hover sectors or pins for instant telemetry</span>
               </div>
            </div>
         </motion.div>

         {/* Right Sidebar: Equal Sized 50/50 Cards, telemetry/diagonal-card styling */}
         <aside className="flex flex-col gap-3.5 h-full min-h-0 overflow-hidden">
            {/* Card 1 (Top 50%): Circuit Vital Stats */}
            <div className="telemetry-card p-4 flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative">
               <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                  style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
               />
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.06] bg-f1-red/10">
                           <Info className="h-3.5 w-3.5 text-f1-red" />
                        </div>
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-f1-silver/70">
                           Circuit Vital Stats
                        </span>
                     </div>
                     <span className="text-[10px] bg-white/[0.04] text-f1-silver/60 font-mono px-2 py-0.5 rounded border border-white/[0.06] font-semibold">
                        {circuit.country}
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2 my-auto">
                  <Stat icon={<Ruler className="h-3.5 w-3.5 text-f1-red" />} colorHex="#E10600" label="Length" value={`${circuit.lengthKm} km`} />
                  <Stat icon={<Flag className="h-3.5 w-3.5 text-emerald-400" />} colorHex="#10b981" label="Race" value={`${circuit.raceDistanceKm} km`} />
                  <Stat icon={<Activity className="h-3.5 w-3.5 text-sky-400" />} colorHex="#38bdf8" label="Laps" value={circuit.laps} />
                  <Stat icon={<Zap className="h-3.5 w-3.5 text-yellow-300" />} colorHex="#f59e0b" label="Turns" value={circuit.corners} />
                  <Stat icon={<Wind className="h-3.5 w-3.5 text-cyan-400" />} colorHex="#22d3ee" label="Aero" value={circuit.activeAeroZones.length} />
                  <Stat icon={<Timer className="h-3.5 w-3.5 text-purple-400" />} colorHex="#a855f7" label="Top Spd" value={`${circuit.speedTrap.historicalTopSpeedKmh} km/h`} />
               </div>

               <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-f1-silver/40 font-mono uppercase tracking-wider">
                  <span>Speed Trap: {circuit.speedTrap.location}</span>
               </div>
            </div>

            {/* Card 2 (Bottom 50%): Circuit Facts & Lore (Auto-Rotating) — diagonal-card accent bar like leaderboard cards */}
            <div
               onMouseEnter={() => setIsFactHovered(true)}
               onMouseLeave={() => setIsFactHovered(false)}
               className="diagonal-card p-4 flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative group"
            >
               {/* Dynamic accent line matching current fact's tag color */}
               <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                  style={{ backgroundColor: TAG_ACCENT[currentFact?.tag] || '#E10600' }}
               />

               {/* Animated Auto-Rotation Progress Bar */}
               {!isFactHovered && circuitFacts.length > 1 && (
                  <motion.div
                     key={`progress-${factIndex}`}
                     initial={{ width: '0%' }}
                     animate={{ width: '100%' }}
                     transition={{ duration: 7.5, ease: 'linear' }}
                     className="absolute top-0 left-1.5 right-0 h-0.5 bg-gradient-to-r from-f1-red via-amber-500 to-f1-red opacity-60 shadow-sm"
                  />
               )}

               {/* Card Header & Controls */}
               <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2 flex-shrink-0 pl-1">
                  <div className="flex items-center gap-2 text-f1-white font-mono font-bold text-[11px] uppercase tracking-widest">
                     <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                     <span>Circuit Lore &amp; Trivia</span>
                  </div>

                  {/* Fact Dots & Manual Next Button */}
                  <div className="flex items-center gap-1.5">
                     <div className="flex items-center gap-1 mr-1">
                        {circuitFacts.map((_, idx) => (
                           <button
                              key={idx}
                              onClick={() => setFactIndex(idx)}
                              className={`h-1.5 rounded-full transition-all duration-300 ${(factIndex % circuitFacts.length) === idx
                                 ? 'w-4 bg-f1-red shadow-sm'
                                 : 'w-1.5 bg-white/20 hover:bg-white/40'
                                 }`}
                              title={`Jump to fact ${idx + 1}`}
                           />
                        ))}
                     </div>

                     {circuitFacts.length > 1 && (
                        <button
                           onClick={handleNextFact}
                           className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-f1-silver/80 hover:text-f1-white border border-white/[0.06] transition-all flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider"
                           title="Roll next random fact"
                        >
                           <Shuffle className="w-3 h-3 text-amber-400" />
                           <span>Next</span>
                        </button>
                     )}
                  </div>
               </div>

               {/* Card Body with Animated Fact */}
               <AnimatePresence mode="wait">
                  {currentFact && (
                     <motion.div
                        key={currentFact.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden pl-1"
                     >
                        <div>
                           <div className="flex items-center justify-between mb-1.5">
                              <span
                                 className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${TAG_COLORS[currentFact.tag] || 'bg-white/10 text-white'
                                    }`}
                              >
                                 {currentFact.tag}
                              </span>
                              <span className="text-[10px] text-f1-silver/40 font-mono">
                                 {isFactHovered ? 'Paused' : `Auto-cycling`} ({(factIndex % circuitFacts.length) + 1}/{circuitFacts.length})
                              </span>
                           </div>

                           <h4 className="text-sm md:text-base font-display font-black text-f1-white leading-snug">
                              {currentFact.title}
                           </h4>

                           <p className="mt-2 text-xs text-f1-silver/80 leading-relaxed overflow-y-auto max-h-[105px] pr-1">
                              {currentFact.description}
                           </p>
                        </div>

                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-f1-silver/40 font-mono uppercase tracking-wider">
                           <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-f1-red" />
                              <span>F1 Grand Prix Archives</span>
                           </span>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </aside>
      </div>
   );
};

export default InteractiveCircuitMap;