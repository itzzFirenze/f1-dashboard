import React, { useState, useEffect, useMemo } from 'react';
import {
   Flame, TrendingUp, TrendingDown, Minus, Shield, Zap,
   Trophy, Activity, Star, CheckCircle, Award, Users
} from 'lucide-react';
import { ResponsiveRadar } from '@nivo/radar';
import PageHeroTitle from '../components/ui/PageHeroTitle';
import SeasonSelector from '../components/ui/SeasonSelector';
import DriverSelector from '../components/ui/DriverSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import {
   powerRankingsService,
   DriverPowerRanking,
   SeasonPowerRankingsResult
} from '../services/powerRankingsService';
import type { Driver } from '../types';

const PowerRankingsPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [rankings, setRankings] = useState<DriverPowerRanking[]>([]);
   const [loading, setLoading] = useState(true);
   const [tierFilter, setTierFilter] = useState<'ALL' | 'S' | 'A' | 'B' | 'C'>('ALL');

   // 3 Driver Selector Slots
   const [driver1, setDriver1] = useState<Driver | null>(null);
   const [driver2, setDriver2] = useState<Driver | null>(null);
   const [driver3, setDriver3] = useState<Driver | null>(null);

   useEffect(() => {
      setLoading(true);
      powerRankingsService.getPowerRankings(season)
         .then((res: SeasonPowerRankingsResult) => {
            setRankings(res.rankings);
            // Driver selector slots remain empty on page open until selected by user
         })
         .catch(console.error)
         .finally(() => setLoading(false));
   }, [season]);

   const allDrivers = useMemo(() => rankings.map((r) => r.driver), [rankings]);

   // Mutually exclusive driver lists for each of the 3 slots
   const driversForSlot1 = useMemo(() => {
      return allDrivers.filter((d) => d.id !== driver2?.id && d.id !== driver3?.id);
   }, [allDrivers, driver2, driver3]);

   const driversForSlot2 = useMemo(() => {
      return allDrivers.filter((d) => d.id !== driver1?.id && d.id !== driver3?.id);
   }, [allDrivers, driver1, driver3]);

   const driversForSlot3 = useMemo(() => {
      return allDrivers.filter((d) => d.id !== driver1?.id && d.id !== driver2?.id);
   }, [allDrivers, driver1, driver2]);

   // Selected drivers ranking objects
   const selectedRankings = useMemo(() => {
      const ids = [driver1?.id, driver2?.id, driver3?.id].filter((id): id is number => id !== undefined && id !== null);
      return rankings.filter((r) => ids.includes(r.driver.id));
   }, [rankings, driver1, driver2, driver3]);

   // Radar Data format for Nivo
   const radarData = useMemo(() => {
      if (selectedRankings.length === 0) return [];

      const keys = ['Qualifying Pace', 'Race Craft', 'Consistency', 'Defense', 'Recent Form'];

      return keys.map((key) => {
         const row: Record<string, any> = { metric: key };
         for (const r of selectedRankings) {
            const val =
               key === 'Qualifying Pace' ? r.metrics.qualifyingPace :
                  key === 'Race Craft' ? r.metrics.raceCraft :
                     key === 'Consistency' ? r.metrics.consistency :
                        key === 'Defense' ? r.metrics.defenseUnderPressure :
                           r.metrics.recentForm;
            row[r.driver.code] = val;
         }
         return row;
      });
   }, [selectedRankings]);

   const filteredRankings = useMemo(() => {
      if (tierFilter === 'ALL') return rankings;
      return rankings.filter((r) => r.tier === tierFilter);
   }, [rankings, tierFilter]);

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 backdrop-blur-md">
                     <Flame className="w-3.5 h-3.5 text-amber-400" />
                     <span className="text-amber-400 text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        Form Index & Intelligence
                     </span>
                  </div>

                  <PageHeroTitle icon={Star} titlePrefix="Driver Form &" titleAccent="Power Rankings" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
                     5-factor capability radar ratings: Qualifying pace, race craft, consistency, defense under pressure, and recent form momentum.
                  </p>
               </div>

               <SeasonSelector
                  selectedSeason={season}
                  onSelectSeason={(yr) => setSeason(yr || 2026)}
                  label="Season"
               />
            </div>
         </div>

         {loading && <PageSkeleton />}

         {!loading && (
            <div className="space-y-6">
               {/* ─── 3 Driver Selector Search Bar Setup ─── */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <DriverSelector
                     label="Driver 1"
                     drivers={driversForSlot1}
                     selected={driver1}
                     onSelect={setDriver1}
                     accentColor="#E10600"
                  />
                  <DriverSelector
                     label="Driver 2"
                     drivers={driversForSlot2}
                     selected={driver2}
                     onSelect={setDriver2}
                     accentColor="#38BDF8"
                  />
                  <DriverSelector
                     label="Driver 3"
                     drivers={driversForSlot3}
                     selected={driver3}
                     onSelect={setDriver3}
                     accentColor="#FACC15"
                  />
               </div>

               {/* ─── 5-Factor Radar Spider Studio ─── */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Radar Chart */}
                  <div className="lg:col-span-7 telemetry-card p-6 relative overflow-visible flex flex-col justify-between">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <Activity className="w-4 h-4 text-f1-red" />
                           <h3 className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                              5-Factor Capability Radar Overlay
                           </h3>
                        </div>
                        <span className="text-[10px] font-mono text-f1-silver/50">
                           {selectedRankings.length} of 3 drivers active
                        </span>
                     </div>

                     {selectedRankings.length > 0 ? (
                        <div className="h-80 w-full">
                           <ResponsiveRadar
                              data={radarData}
                              keys={selectedRankings.map((r) => r.driver.code)}
                              indexBy="metric"
                              maxValue={100}
                              valueFormat=">-.0f"
                              margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
                              curve="linearClosed"
                              borderWidth={2.5}
                              borderColor={{ from: 'color' }}
                              gridLevels={4}
                              gridShape="circular"
                              gridLabelOffset={16}
                              dotSize={8}
                              dotColor={{ theme: 'background' }}
                              dotBorderWidth={2}
                              dotBorderColor={{ from: 'color' }}
                              colors={selectedRankings.map((r) => r.driver.constructorColor || '#E10600')}
                              fillOpacity={0.18}
                              animate={true}
                              theme={{
                                 text: { fill: '#9ca3af', fontFamily: 'monospace', fontSize: 11 },
                                 grid: { line: { stroke: 'rgba(255,255,255,0.08)' } },
                                 dots: { text: { fill: '#ffffff' } },
                                 tooltip: { container: { background: '#111317', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } },
                              }}
                           />
                        </div>
                     ) : (
                        <div className="h-80 flex items-center justify-center text-center p-6">
                           <p className="text-sm font-mono text-f1-silver/50">
                              Select at least one driver above to display the radar chart.
                           </p>
                        </div>
                     )}

                     {/* Legend badges */}
                     {selectedRankings.length > 0 && (
                        <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/[0.06] flex-wrap">
                           {selectedRankings.map((r) => (
                              <span
                                 key={r.driver.id}
                                 className="px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-2 bg-white/[0.04] border border-white/[0.06]"
                              >
                                 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.driver.constructorColor || '#E10600' }} />
                                 <span className="text-f1-white">{r.driver.firstName} {r.driver.lastName} ({r.overallRating})</span>
                              </span>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* Selected Driver Capability Breakdown */}
                  <div className="lg:col-span-5 space-y-3">
                     <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-f1-silver/60">
                        Selected Drivers Comparison
                     </h4>

                     {selectedRankings.map((r) => (
                        <div
                           key={r.driver.id}
                           className="telemetry-card p-4 relative overflow-visible border-l-4"
                           style={{ borderLeftColor: r.driver.constructorColor || '#E10600' }}
                        >
                           <div className="flex items-center justify-between mb-2">
                              <div>
                                 <h4 className="text-sm font-display font-bold text-f1-white">
                                    {r.driver.firstName} {r.driver.lastName}
                                 </h4>
                                 <span className="text-[10px] font-mono text-f1-silver/50 uppercase">{r.driver.constructorName}</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-lg font-display font-black text-amber-400">{r.overallRating}</span>
                                 <span className="text-[10px] font-mono text-f1-silver/50 ml-1">/100</span>
                              </div>
                           </div>

                           {/* 5 Metric mini bars */}
                           <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-mono pt-2 border-t border-white/[0.06]">
                              <div className="p-1 rounded bg-white/[0.02]">
                                 <span className="text-f1-silver/50 block">Quali</span>
                                 <span className="font-bold text-f1-white">{r.metrics.qualifyingPace}</span>
                              </div>
                              <div className="p-1 rounded bg-white/[0.02]">
                                 <span className="text-f1-silver/50 block">Craft</span>
                                 <span className="font-bold text-f1-white">{r.metrics.raceCraft}</span>
                              </div>
                              <div className="p-1 rounded bg-white/[0.02]">
                                 <span className="text-f1-silver/50 block">Const</span>
                                 <span className="font-bold text-f1-white">{r.metrics.consistency}</span>
                              </div>
                              <div className="p-1 rounded bg-white/[0.02]">
                                 <span className="text-f1-silver/50 block">Def</span>
                                 <span className="font-bold text-f1-white">{r.metrics.defenseUnderPressure}</span>
                              </div>
                              <div className="p-1 rounded bg-white/[0.02]">
                                 <span className="text-f1-silver/50 block">Form</span>
                                 <span className="font-bold text-amber-400">{r.metrics.recentForm}</span>
                              </div>
                           </div>
                        </div>
                     ))}

                     {selectedRankings.length === 0 && (
                        <div className="telemetry-card p-8 text-center border border-white/[0.06]">
                           <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-f1-silver/50">
                              <Users className="w-6 h-6" />
                           </div>
                           <h5 className="text-sm font-display font-bold text-f1-white mb-1">
                              No Drivers Selected
                           </h5>
                           <p className="text-xs font-mono text-f1-silver/50 leading-relaxed max-w-xs mx-auto">
                              Choose up to 3 drivers in the search selectors above to compare capability ratings side-by-side.
                           </p>
                        </div>
                     )}
                  </div>
               </div>

               {/* ─── Power Rankings Leaderboard ─── */}
               <div className="telemetry-card p-5 sm:p-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-4">
                     <div>
                        <h3 className="text-lg font-display font-black text-f1-white uppercase tracking-tight">
                           Power Rankings Leaderboard
                        </h3>
                        <p className="text-xs font-mono text-f1-silver/60">
                           Full season intelligence & form momentum ratings
                        </p>
                     </div>

                     {/* Tier Filters */}
                     <div className="flex items-center gap-1.5 flex-wrap">
                        {(['ALL', 'S', 'A', 'B', 'C'] as const).map((tier) => (
                           <button
                              key={tier}
                              onClick={() => setTierFilter(tier)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${tierFilter === tier
                                 ? 'bg-f1-white text-f1-black'
                                 : 'bg-white/[0.04] text-f1-silver/70 hover:text-white'
                                 }`}
                           >
                              {tier === 'ALL' ? 'All Tiers' : `Tier ${tier}`}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="space-y-2">
                     {filteredRankings.map((r) => {
                        const isSelected = selectedRankings.some((sr) => sr.driver.id === r.driver.id);
                        const isHot = r.trend === 'HOT';
                        const isCold = r.trend === 'COLD';
                        const isRising = r.trend === 'RISING';
                        const isFalling = r.trend === 'FALLING';

                        return (
                           <div
                              key={r.driver.id}
                              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isSelected
                                 ? 'bg-white/[0.05] border-white/20'
                                 : 'bg-white/[0.02] border-white/[0.04]'
                                 }`}
                           >
                              {/* Left: Rank, Rank change, Driver name & team */}
                              <div className="flex items-center gap-3.5 min-w-0">
                                 <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-display font-black text-sm text-f1-white shrink-0">
                                    #{r.rank}
                                 </span>

                                 <div className="flex items-center gap-1 shrink-0 w-8">
                                    {r.rankChange > 0 && (
                                       <span className="text-emerald-400 font-mono text-xs font-bold flex items-center">
                                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{r.rankChange}
                                       </span>
                                    )}
                                    {r.rankChange < 0 && (
                                       <span className="text-rose-400 font-mono text-xs font-bold flex items-center">
                                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" />{r.rankChange}
                                       </span>
                                    )}
                                    {r.rankChange === 0 && (
                                       <span className="text-f1-silver/40 font-mono text-xs font-bold flex items-center">
                                          <Minus className="w-3.5 h-3.5" />
                                       </span>
                                    )}
                                 </div>

                                 <div
                                    className="w-1.5 h-8 rounded-full shrink-0"
                                    style={{ backgroundColor: r.driver.constructorColor || '#E10600' }}
                                 />

                                 <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                       <h4 className="font-display font-bold text-sm text-f1-white truncate">
                                          {r.driver.firstName} {r.driver.lastName}
                                       </h4>
                                       <span className="text-xs font-mono text-f1-silver/50 shrink-0">
                                          ({r.driver.code})
                                       </span>
                                    </div>
                                    <p className="text-[11px] font-mono text-f1-silver/60 truncate">
                                       {r.driver.constructorName} · P{r.driver.championshipPosition} in Championship
                                    </p>
                                 </div>
                              </div>

                              {/* Right: Tier Badge, Rating, Trend */}
                              <div className="flex items-center gap-4 shrink-0">
                                 {/* Tier Badge */}
                                 <span
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black ${r.tier === 'S' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' :
                                       r.tier === 'A' ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30' :
                                          r.tier === 'B' ? 'bg-sky-400/15 text-sky-300 border border-sky-400/30' :
                                             'bg-white/[0.05] text-f1-silver/70 border border-white/[0.08]'
                                       }`}
                                 >
                                    Tier {r.tier}
                                 </span>

                                 {/* Trend Indicator */}
                                 <div className="hidden sm:flex items-center gap-1">
                                    {isHot && (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                          <Flame className="w-3 h-3" /> HOT
                                       </span>
                                    )}
                                    {isRising && (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                          <TrendingUp className="w-3 h-3" /> RISING
                                       </span>
                                    )}
                                    {isCold && (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                                          COLD
                                       </span>
                                    )}
                                    {isFalling && (
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                                          <TrendingDown className="w-3 h-3" /> FALLING
                                       </span>
                                    )}
                                 </div>

                                 {/* Overall Rating Score */}
                                 <div className="text-right w-14">
                                    <span className="text-lg font-display font-black text-f1-white block">
                                       {r.overallRating}
                                    </span>
                                    <span className="text-[9px] font-mono text-f1-silver/40 uppercase">Rating</span>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default PowerRankingsPage;
