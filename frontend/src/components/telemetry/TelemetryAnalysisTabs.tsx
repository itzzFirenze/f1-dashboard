import React from 'react';
import { Activity, Info, CornerDownRight, Zap } from 'lucide-react';
import type { CircuitData } from '../../data/circuits/types';
import type { TelemetryComparisonResult } from '../../services/telemetryAnalysisService';

interface TelemetryAnalysisTabsProps {
   activeTab: 'telemetry' | 'corners' | 'insights';
   setActiveTab: (tab: 'telemetry' | 'corners' | 'insights') => void;
   comparison: TelemetryComparisonResult;
   currentCircuit: CircuitData;
   cornerFilter: 'ALL' | 'A' | 'B';
   setCornerFilter: (filter: 'ALL' | 'A' | 'B') => void;
   filteredCorners: any[];
   children: React.ReactNode;
}

export const TelemetryAnalysisTabs: React.FC<TelemetryAnalysisTabsProps> = ({
   activeTab,
   setActiveTab,
   comparison,
   currentCircuit,
   cornerFilter,
   setCornerFilter,
   filteredCorners,
   children,
}) => {
   return (
      <>
         {/* Tab Switcher */}
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
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                     activeTab === id
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
         {activeTab === 'telemetry' && children}

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
                        <div
                           key={s.sectorNumber}
                           className="telemetry-card p-5 flex flex-col justify-between border-t-4"
                           style={{ borderTopColor: winnerColor }}
                        >
                           <div>
                              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                                 <span className="text-xs font-mono font-bold text-f1-white uppercase">
                                    Sector {s.sectorNumber}
                                 </span>
                                 <span
                                    className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold"
                                    style={{ backgroundColor: `${winnerColor}20`, color: winnerColor }}
                                 >
                                    {winnerCode} +{Math.abs(s.timeDelta)}s
                                 </span>
                              </div>
                              <h4 className="text-sm font-display font-bold text-f1-white mb-2">{s.title}</h4>
                              <p className="text-xs font-mono text-f1-silver/70 leading-relaxed">{s.analysisText}</p>
                           </div>
                           <div className="pt-3 mt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs font-mono">
                              <div>
                                 <span className="text-f1-silver/50 block" style={{ color: comparison.driverA.displayColor }}>
                                    {comparison.driverA.code}
                                 </span>
                                 <span className="text-f1-white font-bold">{sectorTimes[s.sectorNumber - 1][0]}s</span>
                              </div>
                              <div>
                                 <span className="text-f1-silver/50 block" style={{ color: comparison.driverB.displayColor }}>
                                    {comparison.driverB.code}
                                 </span>
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
                           className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                              cornerFilter === f
                                 ? f === 'ALL'
                                    ? 'bg-f1-white text-f1-black'
                                    : f === 'A'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-sky-500 text-white'
                                 : 'bg-white/[0.04] text-f1-silver/70 hover:text-white'
                           }`}
                        >
                           {f === 'ALL'
                              ? `All (${comparison.corners.length})`
                              : f === 'A'
                              ? `${comparison.driverA.code} faster (${comparison.summary.sectorsFasterA})`
                              : `${comparison.driverB.code} faster (${comparison.summary.sectorsFasterB})`}
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
                           className={`telemetry-card p-4 hover:border-white/20 transition-all ${
                              isAFaster ? 'border-l-4 border-l-emerald-500' : isBFaster ? 'border-l-4 border-l-sky-500' : ''
                           }`}
                        >
                           <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                 <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-black text-f1-white">
                                    T{corner.cornerNumber}
                                 </span>
                                 <div>
                                    <h4 className="text-xs font-display font-bold text-f1-white">{corner.cornerName}</h4>
                                    <span className="text-[10px] font-mono text-f1-silver/50 uppercase">
                                       {corner.cornerType}
                                    </span>
                                 </div>
                              </div>
                              <span
                                 className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isAFaster
                                       ? 'bg-emerald-500/15 text-emerald-400'
                                       : isBFaster
                                       ? 'bg-sky-500/15 text-sky-300'
                                       : 'bg-white/[0.05] text-f1-silver/70'
                                 }`}
                              >
                                 {isAFaster
                                    ? `${comparison.driverA.code} +${Math.abs(corner.deltaApexSpeed)}`
                                    : isBFaster
                                    ? `${comparison.driverB.code} +${Math.abs(corner.deltaApexSpeed)}`
                                    : 'Equal'}{' '}
                                 km/h
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
                                 <span className="text-f1-silver/90">
                                    {corner.entrySpeedA}/{corner.exitSpeedA} vs {corner.entrySpeedB}/{corner.exitSpeedB}
                                 </span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-f1-silver/60">Apex Gear:</span>
                                 <span className="text-f1-white">
                                    G{corner.apexGearA} vs G{corner.apexGearB}
                                 </span>
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
   );
};

export default TelemetryAnalysisTabs;
