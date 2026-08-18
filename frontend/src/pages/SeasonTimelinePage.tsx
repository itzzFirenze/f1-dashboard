import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Trophy, AlertTriangle, TrendingUp, ArrowUp, Clock, Filter, Radio, Zap } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { analyticsService } from '../services/analyticsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { TimelineData, TimelineEvent } from '../types';

/** Compact telemetry stat block (no gauge dial — used for timeline summary strip) */
const TelemetryStat: React.FC<{ label: string; value: number | string; colorHex: string; icon: React.ElementType; tag: string }> = ({
   label, value, colorHex, icon: Icon, tag
}) => (
   <div className="telemetry-card p-4 relative overflow-hidden">
      <div
         className="absolute top-0 inset-x-0 h-[2px] opacity-75"
         style={{ background: `linear-gradient(90deg, transparent, ${colorHex}, transparent)` }}
      />
      <div className="flex items-center justify-between mb-2">
         <div
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.06]"
            style={{ backgroundColor: `${colorHex}15` }}
         >
            <Icon className="w-3.5 h-3.5" style={{ color: colorHex }} />
         </div>
         <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/[0.04] text-f1-silver/50 border border-white/[0.06]">
            {tag}
         </span>
      </div>
      <div className="text-2xl sm:text-3xl font-black font-display text-f1-white leading-none">{value}</div>
      <p className="text-[10px] font-mono text-f1-silver/50 tracking-widest uppercase mt-1.5">{label}</p>
   </div>
);

const SeasonTimelinePage: React.FC = () => {
   const [data, setData] = useState<TimelineData | null>(null);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming'>('all');

   useEffect(() => {
      analyticsService.getTimeline()
         .then(setData)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, []);

   const filteredEvents = useMemo(() => {
      if (!data) return [];
      if (filter === 'completed') return data.events.filter(e => e.status === 'COMPLETED');
      if (filter === 'upcoming') return data.events.filter(e => e.status !== 'COMPLETED');
      return data.events;
   }, [data, filter]);

   const gapChartData = useMemo(() => {
      if (!data || data.gapEvolution.length === 0) return [];
      return [
         {
            id: 'Championship Gap',
            color: '#E10600',
            data: data.gapEvolution.map(g => ({ x: `R${g.round}`, y: g.gap })),
         },
      ];
   }, [data]);

   const seasonStats = useMemo(() => {
      if (!data) return { completed: 0, upcoming: 0, leadChanges: 0, uniqueWinners: 0 };
      const completed = data.events.filter(e => e.status === 'COMPLETED').length;
      const upcoming = data.events.filter(e => e.status !== 'COMPLETED').length;
      const leadChanges = data.events.filter(e => e.leadChanged).length;
      const uniqueWinners = new Set(data.events.filter(e => e.winnerCode).map(e => e.winnerCode)).size;
      return { completed, upcoming, leadChanges, uniqueWinners };
   }, [data]);

   if (loading) return <PageSkeleton />;
   if (!data) return null;

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-7 sm:p-9 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-f1-red/[0.04] to-transparent transform skew-x-12 pointer-events-none" />

            <div className="relative z-10 space-y-2">
               <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-f1-red-light" />
                  <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                     SEASON LOG / RACE-BY-RACE FEED
                  </span>
               </div>

               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-f1-white uppercase">
                  SEASON <span className="gradient-text">TIMELINE</span>
               </h1>

               <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  Every race, every turning point — the full telemetry trace of the championship battle.
               </p>
            </div>
         </div>

         {/* ─── Season Summary Telemetry Grid ─── */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TelemetryStat label="Races Completed" value={seasonStats.completed} colorHex="#10b981" icon={Calendar} tag="DONE" />
            <TelemetryStat label="Races Remaining" value={seasonStats.upcoming} colorHex="#f59e0b" icon={Clock} tag="NEXT" />
            <TelemetryStat label="Lead Changes" value={seasonStats.leadChanges} colorHex="#a855f7" icon={Zap} tag="SWING" />
            <TelemetryStat label="Unique Winners" value={seasonStats.uniqueWinners} colorHex="#38bdf8" icon={Trophy} tag="SPREAD" />
         </div>

         {/* ─── Gap Evolution Chart ─── */}
         {gapChartData.length > 0 && gapChartData[0].data.length > 0 && (
            <div className="telemetry-card p-6 relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-mono font-bold text-f1-silver/70 tracking-[0.2em] uppercase flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] bg-f1-red/15">
                        <TrendingUp className="w-4 h-4 text-f1-red-light" />
                     </div>
                     Championship Gap Evolution — P1 vs P2
                  </h2>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06]">
                     LIVE TRACE
                  </span>
               </div>
               <div style={{ height: 280 }}>
                  <ResponsiveLine
                     data={gapChartData}
                     margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
                     xScale={{ type: 'point' }}
                     yScale={{ type: 'linear', min: 0, max: 'auto' }}
                     curve="monotoneX"
                     colors={['#E10600']}
                     enableArea={true}
                     areaBaselineValue={0}
                     areaOpacity={0.15}
                     pointSize={8}
                     pointColor="#0a0a12"
                     pointBorderWidth={2}
                     pointBorderColor="#E10600"
                     enableSlices="x"
                     theme={{
                        text: { fill: '#9ca3af', fontFamily: 'monospace', fontSize: 11 },
                        axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                        grid: { line: { stroke: 'rgba(255,255,255,0.06)' } },
                        crosshair: { line: { stroke: '#E10600' } },
                        tooltip: { container: { background: '#111118', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } },
                     }}
                     axisBottom={{ tickRotation: -45 }}
                     axisLeft={{ legend: 'Points Gap', legendPosition: 'middle', legendOffset: -50 }}
                  />
               </div>
            </div>
         )}

         {/* ─── Filter Console ─── */}
         <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mr-1">
               <Filter className="w-3.5 h-3.5" />
               Feed Filter
            </div>
            {(['all', 'completed', 'upcoming'] as const).map(f => (
               <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider transition-all border ${filter === f
                        ? 'bg-f1-red text-white border-f1-red shadow-lg shadow-f1-red/20'
                        : 'bg-white/[0.03] text-f1-silver/60 border-white/[0.06] hover:text-f1-white hover:border-white/[0.12]'
                     }`}
               >
                  {f}
               </button>
            ))}
         </div>

         {/* Timeline */}
         <div className="relative">
            {/* Vertical HUD trace line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-f1-red via-white/10 to-transparent" />

            <div className="space-y-1">
               {filteredEvents.map((event, idx) => (
                  <TimelineNode key={event.round} event={event} isLast={idx === filteredEvents.length - 1} />
               ))}
            </div>
         </div>

         {filteredEvents.length === 0 && (
            <div className="telemetry-card p-12 text-center">
               <Calendar className="w-16 h-16 text-f1-silver/20 mx-auto mb-4" />
               <p className="text-f1-silver font-mono text-sm uppercase tracking-wider">No events match the selected filter</p>
            </div>
         )}
      </div>
   );
};

const TimelineNode: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
   const isCompleted = event.status === 'COMPLETED';

   return (
      <div className="relative pl-14 pb-6 group">
         {/* Node dot */}
         <div className={`absolute left-4 top-2 w-5 h-5 rounded-full border-2 z-10 transition-all ${isCompleted
            ? event.leadChanged
               ? 'bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/30'
               : 'bg-f1-red border-f1-red shadow-lg shadow-f1-red/30'
            : 'bg-f1-carbon border-white/20'
            }`}>
            {!isCompleted && (
               <div className="absolute inset-0.5 rounded-full animate-pulse bg-white/20" />
            )}
         </div>

         {/* Event card */}
         <div className={`telemetry-card p-5 relative overflow-hidden transition-all duration-300 group-hover:translate-x-1 ${!isCompleted ? 'opacity-60 border-dashed' : ''
            }`}>
            <div
               className={`absolute top-0 inset-x-0 h-[2px] opacity-75 ${event.leadChanged
                     ? 'bg-gradient-to-r from-transparent via-purple-500 to-transparent'
                     : isCompleted
                        ? 'bg-gradient-to-r from-transparent via-f1-red to-transparent'
                        : 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent'
                  }`}
            />

            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-f1-silver/70 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">
                     R{event.round}
                  </span>
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-f1-white">{event.raceName}</h3>
                  <span className="text-xs font-mono text-f1-silver/60">{event.country}</span>
               </div>
               <div className="flex items-center gap-2">
                  {event.leadChanged && (
                     <span className="text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                        ⚡ Lead Change
                     </span>
                  )}
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                     }`}>
                     {isCompleted ? 'Completed' : 'Upcoming'}
                  </span>
               </div>
            </div>

            {/* Date */}
            <div className="text-[11px] font-mono text-f1-silver/50 mt-2 flex items-center gap-1.5 uppercase tracking-wider">
               <Clock className="w-3 h-3" />
               {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Completed race details */}
            {isCompleted && (
               <div className="mt-4 space-y-2.5 pt-4 border-t border-white/[0.04]">
                  {/* Winner */}
                  {event.winnerCode && (
                     <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-mono font-semibold text-f1-silver/70 uppercase tracking-wider">Winner:</span>
                        <span
                           className="font-black text-sm font-display"
                           style={{ color: event.winnerConstructorColor || '#fff' }}
                        >
                           {event.winnerCode}
                        </span>
                        <span className="text-xs font-mono text-f1-silver/50">({event.winnerConstructor})</span>
                     </div>
                  )}

                  {/* Championship leader */}
                  {event.championshipLeaderCode && (
                     <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono font-semibold text-f1-silver/70 uppercase tracking-wider">Leader:</span>
                        <span className="font-black text-sm font-display text-f1-white">{event.championshipLeaderCode}</span>
                        <span className="text-xs font-mono text-f1-silver/50">
                           ({event.leaderPoints} pts, +{event.gapToSecond.toFixed(0)} gap)
                        </span>
                     </div>
                  )}

                  {/* Key events */}
                  {event.keyEvents.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-1">
                        {event.keyEvents.map((ke, i) => (
                           <span
                              key={i}
                              className="text-[10px] font-mono bg-white/[0.04] text-f1-silver/70 border border-white/[0.06] px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider"
                           >
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              {ke}
                           </span>
                        ))}
                     </div>
                  )}
               </div>
            )}

            {/* Upcoming race - show countdown hint */}
            {!isCompleted && (
               <div className="mt-3 pt-3 border-t border-white/[0.04] text-xs font-mono text-f1-silver/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Race weekend upcoming
               </div>
            )}
         </div>
      </div>
   );
};

export default SeasonTimelinePage;