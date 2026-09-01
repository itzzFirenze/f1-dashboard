import React from 'react';
import { Crosshair, Maximize2, RotateCcw, Play, Pause } from 'lucide-react';
import type { CircuitData } from '../../data/circuits/types';
import type { TelemetryComparisonResult } from '../../services/telemetryAnalysisService';
import type { LapMode } from './TelemetryMatchupHeader';

interface GhostLapReplayProps {
   currentCircuit: CircuitData;
   comparison: TelemetryComparisonResult;
   lapMode: LapMode;
   cameraMode: 'focus' | 'full';
   setCameraModeAndApply: (mode: 'focus' | 'full') => void;
   zoomLevel: number;
   setZoomLevelAndApply: (zoom: number) => void;
   displayProgress: number;
   svgElRef: React.Ref<SVGSVGElement>;
   svgPathRef: React.Ref<SVGPathElement>;
   ghostARef: React.Ref<SVGGElement>;
   ghostBRef: React.Ref<SVGGElement>;
   scrubberRef: React.Ref<HTMLInputElement>;
   playbackSpeed: number;
   setPlaybackSpeed: (speed: number) => void;
   isPlaying: boolean;
   hasFinished: boolean;
   togglePlay: () => void;
   resetPlay: () => void;
   handleScrub: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GhostLapReplay: React.FC<GhostLapReplayProps> = ({
   currentCircuit,
   comparison,
   lapMode,
   cameraMode,
   setCameraModeAndApply,
   zoomLevel,
   setZoomLevelAndApply,
   displayProgress,
   svgElRef,
   svgPathRef,
   ghostARef,
   ghostBRef,
   scrubberRef,
   playbackSpeed,
   setPlaybackSpeed,
   isPlaying,
   hasFinished,
   togglePlay,
   resetPlay,
   handleScrub,
}) => {
   return (
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

                  {/* Row 2: Camera Mode & Zoom Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                     <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
                        <button
                           onClick={() => setCameraModeAndApply('focus')}
                           className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${cameraMode === 'focus'
                              ? 'bg-f1-red text-white shadow-md shadow-f1-red/20'
                              : 'text-f1-silver/70 hover:text-white'
                              }`}
                           title="Focus camera closely on the cars"
                        >
                           <Crosshair className="w-3 h-3" />
                           <span>Driver Focus</span>
                        </button>
                        <button
                           onClick={() => setCameraModeAndApply('full')}
                           className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${cameraMode === 'full'
                              ? 'bg-f1-red text-white shadow-md shadow-f1-red/20'
                              : 'text-f1-silver/70 hover:text-white'
                              }`}
                           title="View entire circuit"
                        >
                           <Maximize2 className="w-3 h-3" />
                           <span>Full Track</span>
                        </button>
                     </div>

                     {/* Zoom pills */}
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
                        <circle
                           r="10"
                           fill={comparison.driverB.displayColor}
                           stroke="#fff"
                           strokeWidth="2"
                           strokeDasharray={comparison.driverB.lineStyle === 'dashed' ? '3 2' : undefined}
                        />
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
                  <span
                     className="w-3 h-1.5 rounded"
                     style={{
                        backgroundColor: comparison.driverB.displayColor,
                        opacity: comparison.driverB.lineStyle === 'dashed' ? 0.7 : 1,
                     }}
                  />
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
                     Lap Replay — {lapMode === 'Q3' ? 'Quali Best Lap' : 'Race Best Lap'}
                  </h3>
                  <div className="flex items-center gap-1">
                     {([0.5, 1, 2, 4] as const).map((spd) => (
                        <button
                           key={spd}
                           onClick={() => setPlaybackSpeed(spd)}
                           className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${playbackSpeed === spd
                              ? 'bg-f1-red text-white'
                              : 'bg-white/[0.04] text-f1-silver/70 hover:text-white'
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
                     style={{
                        background: `linear-gradient(to right, #E10600 ${displayProgress}%, rgba(255,255,255,0.1) ${displayProgress}%)`,
                     }}
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
                        <>
                           <Pause className="w-4 h-4" /> Pause Replay
                        </>
                     ) : hasFinished ? (
                        <>
                           <RotateCcw className="w-4 h-4" /> Replay Lap
                        </>
                     ) : (
                        <>
                           <Play className="w-4 h-4 fill-current" /> Play Ghost Lap
                        </>
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
   );
};

export default GhostLapReplay;