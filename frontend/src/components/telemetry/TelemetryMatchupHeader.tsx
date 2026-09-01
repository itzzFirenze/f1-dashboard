import React from 'react';
import { Gauge, Activity, ArrowLeftRight, Ban, Calendar, AlertCircle, UserCheck } from 'lucide-react';
import PageHeroTitle from '../ui/PageHeroTitle';
import SeasonSelector from '../ui/SeasonSelector';
import DriverSelector from '../ui/DriverSelector';
import type { Driver, Race } from '../../types';
import type { TelemetryComparisonResult } from '../../services/telemetryAnalysisService';

export type LapMode = 'Q3' | 'Race';

interface TelemetryMatchupHeaderProps {
   season: number;
   setSeason: (season: number) => void;
   races: Race[];
   selectedRaceId: number | null;
   setSelectedRaceId: (id: number) => void;
   activeRace: Race | null;
   lapMode: LapMode;
   setLapMode: (mode: LapMode) => void;
   driverA: Driver | null;
   setDriverA: (d: Driver | null) => void;
   driverB: Driver | null;
   setDriverB: (d: Driver | null) => void;
   driversForA: Driver[];
   driversForB: Driver[];
   swapDrivers: () => void;
   isCompletedSession: boolean;
   isCancelled: boolean;
   comparison: TelemetryComparisonResult | null;
   driverAResult: any;
   driverBResult: any;
   resultLabelA: string;
   resultLabelB: string;
   modeLabel: string;
   isTeammates: boolean;
}

export const TelemetryMatchupHeader: React.FC<TelemetryMatchupHeaderProps> = ({
   season,
   setSeason,
   races,
   selectedRaceId,
   setSelectedRaceId,
   activeRace,
   lapMode,
   setLapMode,
   driverA,
   setDriverA,
   driverB,
   setDriverB,
   driversForA,
   driversForB,
   swapDrivers,
   isCompletedSession,
   isCancelled,
   comparison,
   driverAResult,
   driverBResult,
   resultLabelA,
   resultLabelB,
   modeLabel,
   isTeammates,
}) => {
   return (
      <>
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
               <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                     value={selectedRaceId ?? ''}
                     onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                     className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs font-mono text-f1-white focus:outline-none focus:border-f1-red/50 cursor-pointer w-full min-w-0 sm:w-auto sm:max-w-xs"
                  >
                     {races.map((r) => (
                        <option key={r.id} value={r.id} className="bg-f1-black">
                           R{r.round}: {r.name} ({r.country}) {r.status === 'COMPLETED' ? '✓' : ''}
                        </option>
                     ))}
                  </select>

                  {/* Mode toggle — Q3 vs Race */}
                  <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
                     {(['Q3', 'Race'] as const).map((mode) => (
                        <button
                           key={mode}
                           onClick={() => setLapMode(mode)}
                           className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${lapMode === mode ? 'bg-f1-red text-white' : 'text-f1-silver/70 hover:text-white'
                              }`}
                        >
                           {mode === 'Q3' ? 'Qualifying' : 'Race'}
                        </button>
                     ))}
                  </div>

                  <SeasonSelector selectedSeason={season} onSelectSeason={(yr) => setSeason(yr ?? 2026)} label="Season" />
               </div>
            </div>
         </div>

         {/* ─── Non-Completed / Cancelled Session Alert ─── */}
         {!isCompletedSession ? (
            <div className="telemetry-card p-10 sm:p-14 text-center relative overflow-hidden rounded-3xl border border-white/[0.08] dot-grid animate-fade-in">
               <div className="scanline-overlay" />
               <div className="max-w-lg mx-auto space-y-5 relative z-10">
                  <div
                     className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl ${isCancelled
                           ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                           : season >= 2026
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                              : 'bg-white/[0.06] border border-white/10 text-f1-silver'
                        }`}
                  >
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
                     <ArrowLeftRight
                        className={`w-5 h-5 transition-colors ${driverA && driverB ? 'text-f1-silver/60 group-hover:text-f1-red-light' : 'text-white/20'
                           }`}
                     />
                  </button>
                  <DriverSelector
                     drivers={driversForB}
                     selected={driverB}
                     onSelect={setDriverB}
                     label="Car B"
                     accentColor={(isTeammates ? comparison?.driverB.displayColor : driverB?.constructorColor) || '#38BDF8'}
                  />
               </div>

               {/* ─── Lap Matchup Header Cards ─── */}
               {comparison && driverA && driverB && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch animate-fade-in">
                     {/* Driver A Card */}
                     <div
                        className="lg:col-span-5 telemetry-card p-3 sm:p-5 flex flex-col justify-between border-l-4 transition-all"
                        style={{ borderLeftColor: driverA.constructorColor || '#4B5563' }}
                     >
                        <div>
                           <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/[0.06] mb-2 sm:mb-3">
                              <div className="flex items-center gap-2">
                                 <span
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                                    style={{ backgroundColor: driverA.constructorColor || '#4B5563' }}
                                 />
                                 <span className="text-[10px] sm:text-xs font-mono font-bold text-f1-silver/60 uppercase">
                                    Car A — Solid Line
                                 </span>
                              </div>
                              {lapMode === 'Q3' && driverAResult?.position && (
                                 <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-white/[0.05] text-amber-400">
                                    Quali P{driverAResult.position}
                                 </span>
                              )}
                              {lapMode === 'Race' && driverAResult?.position && (
                                 <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-white/[0.05] text-sky-400">
                                    Race P{driverAResult.position}
                                 </span>
                              )}
                           </div>

                           <div className="flex items-center justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div
                                       className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-display font-bold text-white text-[10px] sm:text-xs shrink-0 shadow-md"
                                       style={{ backgroundColor: driverA.constructorColor }}
                                    >
                                       {driverA.code}
                                    </div>
                                    <div className="truncate">
                                       <p className="font-display font-bold text-f1-white text-sm sm:text-base truncate">
                                          {driverA.firstName} {driverA.lastName}
                                       </p>
                                       <p className="text-[10px] sm:text-xs font-mono truncate" style={{ color: driverA.constructorColor }}>
                                          {driverA.constructorName}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-lg sm:text-2xl font-display font-black text-amber-400 block">{resultLabelA}</span>
                                 <span className="text-[9px] sm:text-[10px] font-mono text-f1-silver/50 uppercase">
                                    Top: {comparison.driverA.topSpeedKmh || 320} km/h
                                 </span>
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/[0.06] text-center text-[10px] sm:text-xs font-mono">
                              {['s1Time', 's2Time', 's3Time'].map((k, i) => (
                                 <div key={k} className="p-1 sm:p-1.5 rounded-lg bg-white/[0.02]">
                                    <span className="text-[8px] sm:text-[9px] text-f1-silver/50 block">S{i + 1}</span>
                                    <span className="font-bold text-f1-white">{(comparison.driverA as any)[k]}s</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Centre Swap & Gap Card */}
                     <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-2 sm:gap-3 p-2 sm:p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                        <div className="text-center">
                           <span className="text-[8px] sm:text-[9px] font-mono text-f1-silver/50 uppercase block">Mode</span>
                           <span className="text-[10px] sm:text-[11px] font-mono font-black text-f1-white">{modeLabel}</span>
                        </div>
                        <button
                           onClick={swapDrivers}
                           className="p-1.5 sm:p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-f1-red/10 hover:border-f1-red/30 text-f1-silver hover:text-white transition-all cursor-pointer shrink-0"
                           title="Swap Drivers"
                        >
                           <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="text-center">
                           <span className="text-[8px] sm:text-[9px] font-mono text-f1-silver/50 uppercase block">Delta</span>
                           <span className={`text-xs sm:text-sm font-mono font-black ${comparison.summary.fasterDriver === 'A' ? 'text-emerald-400' : 'text-sky-400'}`}>
                              {comparison.summary.timeGapSeconds === 0 ? 'TIE' : `+${comparison.summary.timeGapSeconds}s`}
                           </span>
                           <span className="text-[8px] sm:text-[9px] font-mono text-f1-silver/40 block mt-0.5">
                              Faster: {comparison.summary.fasterDriver === 'A' ? comparison.driverA.code : comparison.driverB.code}
                           </span>
                        </div>
                     </div>

                     {/* Driver B Card */}
                     <div
                        className={`lg:col-span-5 telemetry-card p-3 sm:p-5 flex flex-col justify-between border-l-4 transition-all ${comparison.driverB.lineStyle === 'dashed' ? 'border-dashed' : ''
                           }`}
                        style={{ borderLeftColor: comparison.driverB.displayColor || driverB.constructorColor || '#4B5563' }}
                     >
                        <div>
                           <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/[0.06] mb-2 sm:mb-3">
                              <div className="flex items-center gap-2">
                                 <span
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                                    style={{ backgroundColor: comparison.driverB.displayColor || driverB.constructorColor || '#4B5563' }}
                                 />
                                 <span className="text-[10px] sm:text-xs font-mono font-bold text-f1-silver/60 uppercase">
                                    Car B — {comparison.driverB.lineStyle === 'dashed' ? 'Dashed Line' : 'Solid Line'}
                                 </span>
                              </div>
                              {lapMode === 'Q3' && driverBResult?.position && (
                                 <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-white/[0.05] text-amber-400">
                                    Quali P{driverBResult.position}
                                 </span>
                              )}
                              {lapMode === 'Race' && driverBResult?.position && (
                                 <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-white/[0.05] text-sky-400">
                                    Race P{driverBResult.position}
                                 </span>
                              )}
                           </div>

                           <div className="flex items-center justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div
                                       className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-display font-bold text-white text-[10px] sm:text-xs shrink-0 shadow-md"
                                       style={{ backgroundColor: comparison.driverB.displayColor || driverB.constructorColor }}
                                    >
                                       {driverB.code}
                                    </div>
                                    <div className="truncate">
                                       <p className="font-display font-bold text-f1-white text-sm sm:text-base truncate">
                                          {driverB.firstName} {driverB.lastName}
                                       </p>
                                       <p className="text-[10px] sm:text-xs font-mono truncate" style={{ color: comparison.driverB.displayColor || driverB.constructorColor }}>
                                          {driverB.constructorName}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <span className="text-lg sm:text-2xl font-display font-black text-amber-400 block">{resultLabelB}</span>
                                 <span className="text-[9px] sm:text-[10px] font-mono text-f1-silver/50 uppercase">
                                    Top: {comparison.driverB.topSpeedKmh || 320} km/h
                                 </span>
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/[0.06] text-center text-[10px] sm:text-xs font-mono">
                              {['s1Time', 's2Time', 's3Time'].map((k, i) => (
                                 <div key={k} className="p-1 sm:p-1.5 rounded-lg bg-white/[0.02]">
                                    <span className="text-[8px] sm:text-[9px] text-f1-silver/50 block">S{i + 1}</span>
                                    <span className="font-bold text-f1-white">{(comparison.driverB as any)[k]}s</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Empty State when Drivers are not both selected */}
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
            </>
         )}
      </>
   );
};

export default TelemetryMatchupHeader;
