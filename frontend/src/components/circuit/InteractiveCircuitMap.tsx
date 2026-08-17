import React, { useId, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Flag, Info, MapPin, Ruler, Timer, Wind, Zap, Sparkles, Shuffle, BookOpen } from 'lucide-react';
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
      <div className="pointer-events-none absolute left-3 top-14 z-30 w-64 rounded-xl border border-white/20 bg-[#15151e]/95 p-3 shadow-2xl backdrop-blur-xl animate-fade-in">
         <p className="text-xs font-bold text-white uppercase tracking-wider">{tooltip.title}</p>
         <div className="mt-2 space-y-1">
            {tooltip.rows.map(([label, value]) => (
               <div key={label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-white/50">{label}</span>
                  <span className="text-right font-medium text-white">{value}</span>
               </div>
            ))}
         </div>
      </div>
   );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
   <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-white/50 text-[11px] uppercase font-bold tracking-wider">
         {icon}
         <span>{label}</span>
      </div>
      <p className="text-xs md:text-sm font-bold text-white font-mono">{value}</p>
   </div>
);

const TAG_COLORS: Record<CircuitFact['tag'], string> = {
   'Iconic Moment': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
   'Track Quirk': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
   'Driving Challenge': 'bg-rose-500/20 text-rose-300 border-rose-500/40',
   'Historical Lore': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
   Engineering: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const InteractiveCircuitMap: React.FC<InteractiveCircuitMapProps> = ({ circuit }) => {
   const rawPathId = useId();
   const pathId = useMemo(() => `track-${rawPathId.replace(/:/g, '')}`, [rawPathId]);
   const [hoveredSector, setHoveredSector] = useState<Sector | null>(null);
   const [hoveredZone, setHoveredZone] = useState<ActiveAeroZoneType | null>(null);
   const [tooltip, setTooltip] = useState<Tooltip>(null);
   const [computedViewBox, setComputedViewBox] = useState<string>(circuit.viewBox || '0 0 500 500');
   const pathRef = React.useRef<SVGPathElement | null>(null);

   // Circuit Facts State
   const [factIndex, setFactIndex] = useState<number>(0);

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
               ['Fastest holder', sector.fastestSectorHolder],
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] xl:grid-cols-[1fr_370px] gap-3.5 items-stretch h-full min-h-0 overflow-hidden">
         {/* Main Large Circuit Map Stage */}
         <motion.div
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#1e1e2e]/90 p-4 shadow-2xl backdrop-blur-xl h-full min-h-0"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            key={circuit.id}
         >
            <TooltipPanel tooltip={tooltip} />

            {/* Top Circuit Title & Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 flex-shrink-0">
               <div>
                  <h2 className="text-lg md:text-xl font-display font-extrabold text-white leading-tight">
                     {circuit.name}
                  </h2>
                  <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                     <MapPin className="h-3.5 w-3.5 text-f1-red" />
                     <span>
                        {circuit.location}, {circuit.country}
                     </span>
                  </p>
               </div>

               {/* Sector & Aero Legend Pills */}
               <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold">
                  <span className="rounded-md border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-red-300">Sector 1</span>
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-sky-300">Sector 2</span>
                  <span className="rounded-md border border-yellow-400/30 bg-yellow-400/15 px-2 py-0.5 text-yellow-200">Sector 3</span>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-400/15 px-2 py-0.5 text-cyan-200">Active Aero</span>
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-emerald-200">DRS</span>
               </div>
            </div>

            {/* SVG Track Map Canvas */}
            <div className="flex-1 w-full h-full min-h-0 relative flex items-center justify-center overflow-hidden my-1">
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
            <div className="border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60 bg-white/[0.02] px-3 py-1.5 rounded-xl flex-shrink-0">
               <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">Lap Record:</span>
                  <span className="font-mono text-white/95 font-bold">{circuit.lapRecord}</span>
                  <span className="text-white/50">({circuit.lapRecordHolder})</span>
               </div>
               <div className="flex items-center gap-1.5 text-white/40 text-[11px]">
                  <span>Hover over sectors or pins on map for instant details</span>
               </div>
            </div>
         </motion.div>

         {/* Right Sidebar: Equal Sized 50/50 Cards */}
         <aside className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
            {/* Card 1 (Top 50%): Circuit Vital Stats */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e]/90 p-4 shadow-xl backdrop-blur-xl flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
               <div>
                  <div className="flex items-center justify-between mb-1.5">
                     <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-f1-red">
                        Official Track Specs
                     </span>
                     <span className="text-[10px] bg-white/10 text-white/80 font-mono px-2 py-0.5 rounded font-bold">
                        {circuit.country}
                     </span>
                  </div>
                  <h3 className="flex items-center gap-2 font-display text-base font-bold text-white mb-2">
                     <Info className="h-4 w-4 text-f1-red" />
                     <span>Circuit Vital Stats</span>
                  </h3>
               </div>

               <div className="grid grid-cols-2 gap-2 my-auto">
                  <Stat icon={<Ruler className="h-3.5 w-3.5 text-f1-red" />} label="Length" value={`${circuit.lengthKm} km`} />
                  <Stat icon={<Flag className="h-3.5 w-3.5 text-emerald-400" />} label="Race" value={`${circuit.raceDistanceKm} km`} />
                  <Stat icon={<Activity className="h-3.5 w-3.5 text-sky-400" />} label="Laps" value={circuit.laps} />
                  <Stat icon={<Zap className="h-3.5 w-3.5 text-yellow-300" />} label="Turns" value={circuit.corners} />
                  <Stat icon={<Wind className="h-3.5 w-3.5 text-cyan-400" />} label="Aero" value={circuit.activeAeroZones.length} />
                  <Stat icon={<Timer className="h-3.5 w-3.5 text-purple-400" />} label="Top Spd" value={`${circuit.speedTrap.historicalTopSpeedKmh} km/h`} />
               </div>

               <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                  <span>Speed Trap: {circuit.speedTrap.location}</span>
               </div>
            </div>

            {/* Card 2 (Bottom 50%): Circuit Facts & Lore (100% Focused) */}
            <div className="rounded-2xl border border-white/10 bg-[#1e1e2e]/95 p-4 shadow-2xl backdrop-blur-xl flex-1 min-h-0 flex flex-col justify-between overflow-hidden relative">
               {/* Card Header & Shuffle Button */}
               <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                     <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                     <span>Circuit Lore & Trivia</span>
                  </div>

                  {circuitFacts.length > 1 && (
                     <button
                        onClick={handleNextFact}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-all flex items-center gap-1 text-[10px] font-bold"
                        title="Roll next random fact"
                     >
                        <Shuffle className="w-3 h-3 text-amber-400" />
                        <span>Next Fact</span>
                     </button>
                  )}
               </div>

               {/* Card Body with Animated Fact */}
               <AnimatePresence mode="wait">
                  {currentFact && (
                     <motion.div
                        key={currentFact.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden"
                     >
                        <div>
                           <div className="flex items-center justify-between mb-1.5">
                              <span
                                 className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${TAG_COLORS[currentFact.tag] || 'bg-white/10 text-white'
                                    }`}
                              >
                                 {currentFact.tag}
                              </span>
                              <span className="text-[10px] text-white/40 font-mono">
                                 Fact {(factIndex % circuitFacts.length) + 1} / {circuitFacts.length}
                              </span>
                           </div>

                           <h4 className="text-sm md:text-base font-display font-extrabold text-white leading-snug">
                              {currentFact.title}
                           </h4>

                           <p className="mt-2 text-xs text-white/80 leading-relaxed overflow-y-auto max-h-[105px] pr-1">
                              {currentFact.description}
                           </p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
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