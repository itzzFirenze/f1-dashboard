import React, { useEffect, useState, useMemo } from 'react';
import { Grid3x3, Target, Radio, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { analyticsService } from '../services/analyticsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { ConsistencyData } from '../types';

const getFinishColor = (value: number | null) => {
   if (value === null || value === undefined || value >= 21) return '#dc2626';
   if (value <= 3) return '#16a34a';
   if (value <= 10) return '#84cc16';
   if (value <= 15) return '#facc15';
   return '#f97316';
};

const ConsistencyPage: React.FC = () => {
   const [data, setData] = useState<ConsistencyData | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      analyticsService.getConsistency()
         .then(setData)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, []);

   const heatmapData = useMemo(() => {
      if (!data) return [];
      return data.drivers.slice(0, 20).map(d => ({
         id: d.driver.code,
         data: data.races.map(race => {
            const val = d.resultsByRace[race];
            const numVal = val === 'DNF' ? 21 : parseInt(val) || 0;
            return { x: race.replace(' Grand Prix', '').substring(0, 8), y: numVal };
         })
      }));
   }, [data]);

   const scatterData = useMemo(() => {
      if (!data) return [];
      const groups: Record<string, { id: string; data: { x: number; y: number; driver: string; color: string }[] }> = {};
      data.drivers.forEach(d => {
         const team = d.driver.constructorName || 'Unknown';
         if (!groups[team]) {
            groups[team] = { id: team, data: [] };
         }
         groups[team].data.push({
            x: Math.round(d.avgFinishPosition * 10) / 10,
            y: Math.round(d.stdDevPosition * 10) / 10,
            driver: d.driver.code,
            color: d.driver.constructorColor,
         });
      });
      return Object.values(groups);
   }, [data]);

   const sortedByRate = useMemo(() => {
      if (!data) return [];
      return [...data.drivers].sort((a, b) => b.pointsFinishRate - a.pointsFinishRate);
   }, [data]);

   if (loading) return <PageSkeleton />;
   if (!data) return null;

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
                     Reliability Engineering
                  </span>
               </div>

               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase flex items-center gap-3">
                  <Grid3x3 className="w-8 h-8 text-f1-red" />
                  Consistency <span className="gradient-text">Analysis</span>
               </h1>

               <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  Who delivers every single weekend? Season-long results, volatility & scoring reliability.
               </p>
            </div>
         </div>

         {/* ─── Season Results Heatmap ─── */}
         {heatmapData.length > 0 && (
            <div className="telemetry-card p-6 relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
               <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4">
                  Season Results Heatmap
               </h3>
               <div className="overflow-x-auto">
                  <div style={{ height: `${heatmapData.length * 36 + 80}px`, minWidth: '700px' }}>
                     <ResponsiveHeatMap
                        data={heatmapData}
                        margin={{ top: 40, right: 30, bottom: 20, left: 60 }}
                        axisTop={{
                           tickSize: 0,
                           tickPadding: 8,
                           tickRotation: -45,
                        }}
                        axisLeft={{
                           tickSize: 0,
                           tickPadding: 8,
                        }}
                        colors={(cell) => getFinishColor(cell.value)}
                        emptyColor="#1e1e2e"
                        borderWidth={1}
                        borderColor="#0d0d14"
                        labelTextColor="#fff"
                        label={(cell) => {
                           const v = cell.value;
                           if (v === null || v === undefined) return '';
                           return v >= 21 ? 'DNF' : `${v}`;
                        }}
                        hoverTarget="cell"
                        animate={true}
                        theme={{
                           text: { fill: '#9ca3af', fontSize: 11, fontFamily: 'ui-monospace, monospace' },
                           axis: { ticks: { text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace' } } },
                           tooltip: { container: { background: '#0d0d14', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'ui-monospace, monospace', fontSize: 12 } },
                        }}
                     />
                  </div>
               </div>
            </div>
         )}

         {/* ─── Points Finish Rate ─── */}
         <div className="telemetry-card p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-4 sm:mb-6">
               Points Finish Rate
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
               {sortedByRate.map((d, idx) => (
                  <div key={d.driver.id} className="flex items-center gap-2 sm:gap-3">
                     <span className="text-[9px] sm:text-[10px] font-mono text-f1-silver/40 w-4 sm:w-6 text-right shrink-0">{idx + 1}</span>
                     <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-display font-bold text-white text-[11px] sm:text-xs shrink-0 border border-white/[0.08] shadow-md"
                        style={{ backgroundColor: d.driver.constructorColor }}
                     >
                        {d.driver.code}
                     </div>
                     <span className="text-xs sm:text-sm font-semibold text-f1-white w-16 sm:w-28 truncate shrink-0">
                        {d.driver.firstName} {d.driver.lastName}
                     </span>
                     <div className="flex-1 min-w-[60px] h-2 sm:h-2.5 rounded-full bg-white/[0.04] border border-white/[0.04] overflow-hidden">
                        <div
                           className="h-full rounded-full transition-all duration-1000"
                           style={{
                              width: `${d.pointsFinishRate}%`,
                              backgroundColor: d.driver.constructorColor,
                              boxShadow: `0 0 8px ${d.driver.constructorColor}80`,
                           }}
                        />
                     </div>
                     <span className="text-xs sm:text-sm font-mono font-bold w-10 sm:w-14 text-right shrink-0" style={{ color: d.driver.constructorColor }}>
                        {d.pointsFinishRate.toFixed(0)}%
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {/* ─── Consistency Scatter Plot ─── */}
         {scatterData.length > 0 && (
            <div className="telemetry-card p-4 sm:p-6 relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
               <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-sky-400" />
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50">
                     Consistency vs Speed
                  </h3>
               </div>
               <p className="text-xs font-mono text-f1-silver/50 mb-4">
                  Bottom-left = consistent &amp; fast. Top-right = inconsistent &amp; slow.
               </p>
               <div className="overflow-x-auto">
                  <div className="h-96 min-w-[500px] sm:min-w-0">
                     <ResponsiveScatterPlot
                        data={scatterData}
                        margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
                        xScale={{ type: 'linear', min: 0, max: 'auto' }}
                        yScale={{ type: 'linear', min: 0, max: 'auto' }}
                        axisBottom={{
                           legend: 'Average Finish Position',
                           legendOffset: 46,
                           legendPosition: 'middle',
                        }}
                        axisLeft={{
                           legend: 'Std Dev (Volatility)',
                           legendOffset: -46,
                           legendPosition: 'middle',
                        }}
                        nodeSize={14}
                        colors={({ serieId }) => {
                           const group = scatterData.find(s => s.id === serieId);
                           return group?.data[0]?.color || '#888';
                        }}
                        animate={true}
                        useMesh={true}
                        tooltip={({ node }) => {
                           const d = node.data as any;
                           return (
                              <div className="bg-f1-carbon border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono">
                                 <strong className="text-f1-white">{d.driver}</strong>
                                 <br />
                                 <span className="text-f1-silver/70">Avg Finish: P{d.x} · StdDev: {d.y}</span>
                              </div>
                           );
                        }}
                        theme={{
                           text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace' },
                           axis: {
                              ticks: { text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace' } },
                              legend: { text: { fill: '#9ca3af', fontFamily: 'ui-monospace, monospace' } },
                           },
                           grid: { line: { stroke: 'rgba(255,255,255,0.06)' } },
                        }}
                        legends={[
                           {
                              anchor: 'bottom-right',
                              direction: 'column',
                              translateX: 10,
                              itemWidth: 130,
                              itemHeight: 18,
                              symbolSize: 10,
                              symbolShape: 'circle',
                              itemTextColor: '#9ca3af',
                           },
                        ]}
                     />
                  </div>
               </div>

               {/* Quadrant Labels */}
               <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-xl p-3.5 bg-emerald-500/[0.06] border border-emerald-500/20 flex items-start gap-2">
                     <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">Consistent &amp; Fast</p>
                        <p className="text-[11px] font-mono text-f1-silver/50 mt-0.5">Low avg position, low volatility</p>
                     </div>
                  </div>
                  <div className="rounded-xl p-3.5 bg-red-500/[0.06] border border-red-500/20 flex items-start gap-2">
                     <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide">Volatile &amp; Slow</p>
                        <p className="text-[11px] font-mono text-f1-silver/50 mt-0.5">High avg position, high volatility</p>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default ConsistencyPage;