import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Flame, Snowflake, Gauge, ChevronRight, Radio } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { driverService } from '../services/driverService';
import { analyticsService } from '../services/analyticsService';
import DriverSelector from '../components/ui/DriverSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { Driver, MomentumData } from '../types';

const MomentumTrackerPage: React.FC = () => {
   const [drivers, setDrivers] = useState<Driver[]>([]);
   const [selected, setSelected] = useState<Driver | null>(null);
   const [window, setWindow] = useState(5);
   const [data, setData] = useState<MomentumData | null>(null);
   const [loading, setLoading] = useState(false);
   const [driversLoading, setDriversLoading] = useState(true);

   useEffect(() => {
      driverService.getAll()
         .then(setDrivers)
         .catch(console.error)
         .finally(() => setDriversLoading(false));
   }, []);

   useEffect(() => {
      if (selected) {
         setLoading(true);
         analyticsService.getMomentum(selected.id, window)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [selected, window]);

   if (driversLoading) return <PageSkeleton />;

   const trendIcon = (trend: string) => {
      if (trend === 'HOT') return <Flame className="w-6 h-6" style={{ color: '#fb923c' }} />;
      if (trend === 'COLD') return <Snowflake className="w-6 h-6" style={{ color: '#60a5fa' }} />;
      return <Minus className="w-6 h-6" style={{ color: '#fbbf24' }} />;
   };

   const trendColor = (trend: string) => {
      if (trend === 'HOT') return '#fb923c';
      if (trend === 'COLD') return '#60a5fa';
      return '#fbbf24';
   };

   const trendLabel = (trend: string) => {
      if (trend === 'HOT') return 'On Fire';
      if (trend === 'COLD') return 'Cold Streak';
      return 'Neutral Form';
   };

   const waterfallData = data?.recentRaces.map(r => ({
      race: `R${r.round}`,
      delta: r.positionDelta,
      deltaColor: r.positionDelta > 0 ? '#34d399' : r.positionDelta < 0 ? '#ef4444' : '#fbbf24',
   })) || [];

   const rollingLineData = data ? [
      {
         id: 'Avg Finish',
         color: '#3b82f6',
         data: data.recentRaces.map(r => ({ x: `R${r.round}`, y: r.rollingAvgFinish })),
      },
      {
         id: 'Avg Points',
         color: '#10b981',
         data: data.recentRaces.map(r => ({ x: `R${r.round}`, y: r.rollingAvgPoints })),
      },
   ] : [];

   const avgPoints = data
      ? (data.recentRaces.reduce((s, r) => s + r.points, 0) / data.recentRaces.length).toFixed(1)
      : '0.0';

   // Gauge arc math
   const gaugeRadius = 70;
   const gaugeCircumference = 2 * Math.PI * gaugeRadius;
   const gaugeOffset = data
      ? gaugeCircumference - (Math.min(Math.max(data.score, 0), 100) / 100) * gaugeCircumference
      : gaugeCircumference;

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Header: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
               <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-f1-red-light" />
                  <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                     Driver Form Telemetry
                  </span>
               </div>

               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase flex items-center gap-3">
                  <Activity className="w-8 h-8 text-f1-red" />
                  Momentum <span className="gradient-text">Tracker</span>
               </h1>

               <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  Live trajectory analysis, rolling averages & grid-to-flag delta engineering.
               </p>
            </div>
         </div>

         {/* ─── Controls ─── */}
         <div className="telemetry-card p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end !overflow-visible relative z-20">
            <DriverSelector drivers={drivers} selected={selected} onSelect={setSelected} label="Select Driver" />
            <div>
               <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-2 block">
                  Sample Window
               </label>
               <div className="flex gap-2">
                  {[3, 5, 10].map(w => (
                     <button
                        key={w}
                        onClick={() => setWindow(w)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold tracking-wider uppercase transition-all border ${window === w
                           ? 'bg-f1-red/15 text-f1-red-light border-f1-red/30'
                           : 'bg-white/[0.03] text-f1-silver/70 border-white/[0.06] hover:border-white/[0.12]'
                           }`}
                     >
                        Last {w}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {loading && <PageSkeleton />}

         {data && !loading && (
            <div className="space-y-6">
               {/* ─── Momentum Score HUD Dial ─── */}
               <div className="telemetry-card p-7 sm:p-8 relative overflow-hidden">
                  <div
                     className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                     style={{ backgroundColor: `${trendColor(data.formTrend)}1a` }}
                  />
                  <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                     {/* Circular HUD gauge */}
                     <div className="relative w-44 h-44 shrink-0">
                        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
                           <circle cx="80" cy="80" r={gaugeRadius} className="gauge-track" />
                           <circle
                              cx="80" cy="80" r={gaugeRadius}
                              className="gauge-fill transition-all duration-1000"
                              style={{
                                 stroke: trendColor(data.formTrend),
                                 strokeDasharray: gaugeCircumference,
                                 strokeDashoffset: gaugeOffset,
                                 filter: `drop-shadow(0 0 8px ${trendColor(data.formTrend)}80)`,
                              }}
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span
                              className="text-4xl font-display font-black"
                              style={{ color: trendColor(data.formTrend) }}
                           >
                              {data.score}
                           </span>
                           <span className="text-[10px] font-mono text-f1-silver/50 tracking-widest uppercase mt-0.5">
                              / 100 Score
                           </span>
                        </div>
                     </div>

                     <div className="flex-1 text-center md:text-left">
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-2">
                           Form Status
                        </div>
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                           {trendIcon(data.formTrend)}
                           <span
                              className="text-2xl sm:text-3xl font-display font-black uppercase tracking-tight"
                              style={{ color: trendColor(data.formTrend) }}
                           >
                              {trendLabel(data.formTrend)}
                           </span>
                        </div>
                        <p className="text-f1-silver text-sm sm:text-base font-medium leading-relaxed">
                           {data.driver.firstName} {data.driver.lastName} has scored an average of{' '}
                           <span className="font-mono font-bold text-f1-white">{avgPoints} pts</span>{' '}
                           per race over the last {data.recentRaces.length} races.
                        </p>
                     </div>
                  </div>
               </div>

               {/* ─── Waterfall Chart — Position Deltas ─── */}
               {waterfallData.length > 0 && (
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
                     <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4">
                        Position Gains / Losses (Grid → Finish)
                     </h3>
                     <div className="h-64">
                        <ResponsiveBar
                           data={waterfallData}
                           keys={['delta']}
                           indexBy="race"
                           margin={{ top: 10, right: 20, bottom: 40, left: 40 }}
                           padding={0.3}
                           colors={({ data }) => (data as any).deltaColor}
                           borderRadius={4}
                           axisBottom={{ tickRotation: 0 }}
                           axisLeft={{ tickSize: 5, format: (v: number) => v > 0 ? `+${v}` : `${v}` }}
                           enableLabel={true}
                           label={d => d.value !== null && d.value !== undefined ? (d.value > 0 ? `+${d.value}` : `${d.value}`) : ''}
                           labelTextColor="#fff"
                           animate={true}
                           theme={{
                              text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace', fontSize: 11 },
                              axis: { ticks: { text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace' } } },
                              grid: { line: { stroke: 'rgba(255,255,255,0.06)' } },
                              tooltip: { container: { background: '#0d0d14', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 12 } },
                           }}
                        />
                     </div>
                  </div>
               )}

               {/* ─── Rolling Average Line Chart ─── */}
               {rollingLineData.length > 0 && rollingLineData[0].data.length > 0 && (
                  <div className="telemetry-card p-6 relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
                     <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4">
                        Rolling Averages
                     </h3>
                     <div className="h-64">
                        <ResponsiveLine
                           data={rollingLineData}
                           margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                           xScale={{ type: 'point' }}
                           yScale={{ type: 'linear', min: 0, max: 'auto' }}
                           curve="monotoneX"
                           lineWidth={3}
                           colors={['#3b82f6', '#10b981']}
                           pointSize={8}
                           pointColor={{ theme: 'background' }}
                           pointBorderWidth={2}
                           pointBorderColor={{ from: 'serieColor' }}
                           useMesh={true}
                           animate={true}
                           theme={{
                              text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace', fontSize: 11 },
                              axis: { ticks: { text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace' } } },
                              grid: { line: { stroke: 'rgba(255,255,255,0.06)' } },
                              tooltip: { container: { background: '#0d0d14', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 12 } },
                           }}
                           legends={[
                              {
                                 anchor: 'top-right',
                                 direction: 'row',
                                 translateY: -10,
                                 itemWidth: 100,
                                 itemHeight: 20,
                                 symbolSize: 12,
                                 symbolShape: 'circle',
                                 itemTextColor: '#9ca3af',
                              },
                           ]}
                        />
                     </div>
                  </div>
               )}

               {/* ─── Recent Form Table ─── */}
               <div className="telemetry-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4">
                     Recent Form Log
                  </h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                        <thead>
                           <tr className="text-f1-silver/60 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider">
                              <th className="text-left py-3 px-4">Race</th>
                              <th className="text-center py-3 px-4">Grid</th>
                              <th className="text-center py-3 px-4">Finish</th>
                              <th className="text-center py-3 px-4">Delta</th>
                              <th className="text-center py-3 px-4">Points</th>
                           </tr>
                        </thead>
                        <tbody>
                           {data.recentRaces.map((r) => (
                              <tr key={r.round} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                                 <td className="py-3 px-4 font-semibold font-mono text-f1-white">{r.raceName}</td>
                                 <td className="py-3 px-4 text-center font-mono text-f1-silver/70">P{r.gridPosition}</td>
                                 <td className="py-3 px-4 text-center font-mono font-bold text-f1-white">P{r.finishPosition}</td>
                                 <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${r.positionDelta > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                                       r.positionDelta < 0 ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                          'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                       }`}>
                                       {r.positionDelta > 0 ? <TrendingUp className="w-3 h-3" /> : r.positionDelta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                       {r.positionDelta > 0 ? `+${r.positionDelta}` : r.positionDelta}
                                    </span>
                                 </td>
                                 <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">{r.points}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* ─── Empty State ─── */}
         {!data && !loading && (
            <div className="telemetry-card p-12 text-center dot-grid relative overflow-hidden">
               <div className="scanline-overlay" />
               <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06]">
                     <Gauge className="w-8 h-8 text-f1-silver/40" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-f1-white uppercase tracking-tight mb-2">
                     Select a Driver
                  </h3>
                  <p className="text-xs font-mono text-f1-silver/50 uppercase tracking-wider">
                     Choose a driver above to track their form and momentum
                  </p>
               </div>
            </div>
         )}
      </div>
   );
};

export default MomentumTrackerPage;