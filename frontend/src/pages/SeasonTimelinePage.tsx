import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Trophy, AlertTriangle, TrendingUp, ArrowUp, Clock, Filter } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { analyticsService } from '../services/analyticsService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { TimelineData, TimelineEvent } from '../types';

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
            color: '#e11d48',
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

   return (
      <div className="space-y-8 animate-fade-in">
         {/* Header */}
         <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
               <Calendar className="w-8 h-8 text-f1-red" />
               2026 Season Timeline
            </h1>
            <p className="text-f1-silver mt-1">Every race, every turning point — the story of the season</p>
         </div>

         {/* Season Summary Cards */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
               <div className="text-2xl font-bold text-white">{seasonStats.completed}</div>
               <div className="text-xs text-f1-silver uppercase tracking-wider mt-1">Races Completed</div>
            </div>
            <div className="glass-card p-4 text-center">
               <div className="text-2xl font-bold text-amber-400">{seasonStats.upcoming}</div>
               <div className="text-xs text-f1-silver uppercase tracking-wider mt-1">Races Remaining</div>
            </div>
            <div className="glass-card p-4 text-center">
               <div className="text-2xl font-bold text-purple-400">{seasonStats.leadChanges}</div>
               <div className="text-xs text-f1-silver uppercase tracking-wider mt-1">Lead Changes</div>
            </div>
            <div className="glass-card p-4 text-center">
               <div className="text-2xl font-bold text-emerald-400">{seasonStats.uniqueWinners}</div>
               <div className="text-xs text-f1-silver uppercase tracking-wider mt-1">Unique Winners</div>
            </div>
         </div>

         {/* Gap Evolution Chart */}
         {gapChartData.length > 0 && gapChartData[0].data.length > 0 && (
            <div className="glass-card p-6">
               <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-f1-red" />
                  Championship Gap Evolution (P1 → P2)
               </h2>
               <div style={{ height: 280 }}>
                  <ResponsiveLine
                     data={gapChartData}
                     margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
                     xScale={{ type: 'point' }}
                     yScale={{ type: 'linear', min: 0, max: 'auto' }}
                     curve="monotoneX"
                     colors={['#e11d48']}
                     enableArea={true}
                     areaBaselineValue={0}
                     areaOpacity={0.15}
                     pointSize={8}
                     pointColor="#1a1a2e"
                     pointBorderWidth={2}
                     pointBorderColor="#e11d48"
                     enableSlices="x"
                     theme={{
                        text: { fill: '#9ca3af' },
                        axis: { ticks: { text: { fill: '#9ca3af' } }, legend: { text: { fill: '#9ca3af' } } },
                        grid: { line: { stroke: '#333' } },
                        crosshair: { line: { stroke: '#e11d48' } },
                        tooltip: { container: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' } },
                     }}
                     axisBottom={{ tickRotation: -45 }}
                     axisLeft={{ legend: 'Points Gap', legendPosition: 'middle', legendOffset: -50 }}
                  />
               </div>
            </div>
         )}

         {/* Filter */}
         <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-f1-silver" />
            {(['all', 'completed', 'upcoming'] as const).map(f => (
               <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f
                     ? 'bg-f1-red text-white'
                     : 'glass-card text-f1-silver hover:text-white'
                     }`}
               >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
               </button>
            ))}
         </div>

         {/* Timeline */}
         <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-f1-red via-f1-mid-gray to-transparent" />

            <div className="space-y-1">
               {filteredEvents.map((event, idx) => (
                  <TimelineNode key={event.round} event={event} isLast={idx === filteredEvents.length - 1} />
               ))}
            </div>
         </div>

         {filteredEvents.length === 0 && (
            <div className="glass-card p-12 text-center">
               <Calendar className="w-16 h-16 text-f1-mid-gray mx-auto mb-4" />
               <p className="text-f1-silver">No events match the selected filter</p>
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
            : 'bg-f1-dark-gray border-f1-mid-gray'
            }`}>
            {!isCompleted && (
               <div className="absolute inset-0.5 rounded-full animate-pulse bg-f1-mid-gray/50" />
            )}
         </div>

         {/* Event card */}
         <div className={`glass-card p-5 transition-all duration-300 group-hover:translate-x-1 ${!isCompleted ? 'opacity-60 border-dashed' : ''
            }`}>
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
               <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-f1-silver bg-f1-dark-gray px-2 py-0.5 rounded">R{event.round}</span>
                  <h3 className="font-display font-semibold text-lg">{event.raceName}</h3>
                  <span className="text-xs text-f1-silver">{event.country}</span>
               </div>
               <div className="flex items-center gap-2">
                  {event.leadChanged && (
                     <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full animate-pulse">
                        ⚡ Lead Change
                     </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                     }`}>
                     {isCompleted ? 'Completed' : 'Upcoming'}
                  </span>
               </div>
            </div>

            {/* Date */}
            <div className="text-xs text-f1-silver mt-1 flex items-center gap-1.5">
               <Clock className="w-3 h-3" />
               {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* Completed race details */}
            {isCompleted && (
               <div className="mt-4 space-y-3">
                  {/* Winner */}
                  {event.winnerCode && (
                     <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold">Winner:</span>
                        <span
                           className="font-bold text-sm"
                           style={{ color: event.winnerConstructorColor || '#fff' }}
                        >
                           {event.winnerCode}
                        </span>
                        <span className="text-xs text-f1-silver">({event.winnerConstructor})</span>
                     </div>
                  )}

                  {/* Championship leader */}
                  {event.championshipLeaderCode && (
                     <div className="flex items-center gap-2">
                        <ArrowUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold">Championship Leader:</span>
                        <span className="font-bold text-sm">{event.championshipLeaderCode}</span>
                        <span className="text-xs text-f1-silver">
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
                              className="text-xs bg-white/5 text-f1-silver px-2 py-1 rounded-full flex items-center gap-1"
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
               <div className="mt-3 text-sm text-f1-silver italic flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Race weekend upcoming
               </div>
            )}
         </div>
      </div>
   );
};

export default SeasonTimelinePage;