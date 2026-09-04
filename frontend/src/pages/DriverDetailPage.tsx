import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
   ArrowLeft, Trophy, Medal, Hash, Globe, Calendar, Radio, ChevronRight,
   TrendingUp, TrendingDown, Minus, ShieldAlert, Flag, Award, Zap,
   CheckCircle2, AlertTriangle, AlertOctagon, Info, Compass, Gauge,
   Clock, LayoutGrid, GitBranch
} from 'lucide-react';
import { driverService } from '../services/driverService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import { raceService } from '../services/raceService';
import type { DriverDetail, DriverHistoryData, DriverRaceResult, DriverPenaltyEvent, DriverPerformanceStats } from '../types';

const DriverDetailPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const [driver, setDriver] = useState<DriverDetail | null>(null);
   const [history, setHistory] = useState<DriverHistoryData | null>(null);
   const [loading, setLoading] = useState(true);
   const [historyLoading, setHistoryLoading] = useState(false);
   const [imgError, setImgError] = useState(false);
   const [logoError, setLogoError] = useState(false);
   const [activeTab, setActiveTab] = useState<'races' | 'penalties'>('races');

   useEffect(() => {
      if (id) {
         setImgError(false);
         setLogoError(false);
         setLoading(true);
         setHistoryLoading(true);

         driverService.getById(Number(id))
            .then(async (driverData) => {
               setDriver(driverData);
               setLoading(false);

               let backendPenalties: DriverPenaltyEvent[] = [];
               try {
                  // Attempt to fetch from backend history endpoint
                  const hist = await driverService.getHistory(Number(id), 2026);
                  if (hist) {
                     backendPenalties = hist.penalties || [];
                     if (hist.races && hist.races.length > 0) {
                        setHistory(hist);
                        setHistoryLoading(false);
                        return;
                     }
                  }
               } catch (err) {
                  console.info('Using dynamic telemetry client fallback for driver history:', err);
               }

               // Fallback: load completed 2026 races and race results
               try {
                  const allRaces = await raceService.getAll(2026);
                  const completedRaces = allRaces.filter((r) => r.status === 'COMPLETED');
                  const raceEntries: DriverRaceResult[] = [];

                  // Load race details in parallel
                  const raceDetailPromises = completedRaces.map((r) => raceService.getById(r.id));
                  const raceDetails = await Promise.all(raceDetailPromises);

                  let totalGrid = 0;
                  let gridCount = 0;
                  let totalFinish = 0;
                  let finishCount = 0;
                  let totalDelta = 0;
                  let dnfs = 0;
                  let fastestLaps = 0;
                  let pointsRaces = 0;
                  let bestFinish: number | null = null;
                  let bestGrid: number | null = null;

                  for (const detail of raceDetails) {
                     const res = detail.results?.find(
                        (r) => r.driverCode === driverData.code ||
                           (r.driverFirstName === driverData.firstName && r.driverLastName === driverData.lastName)
                     );

                     if (res) {
                        const grid = res.gridPosition || 0;
                        const finish = res.position || 0;
                        const delta = grid > 0 && finish > 0 ? grid - finish : 0;

                        if (grid > 0) {
                           totalGrid += grid;
                           gridCount++;
                           bestGrid = bestGrid === null ? grid : Math.min(bestGrid, grid);
                        }
                        if (finish > 0) {
                           totalFinish += finish;
                           finishCount++;
                           bestFinish = bestFinish === null ? finish : Math.min(bestFinish, finish);
                        }
                        totalDelta += delta;
                        if (res.status === 'Retired' || res.status === 'DNF') {
                           dnfs++;
                        }
                        if (res.fastestLap) {
                           fastestLaps++;
                        }
                        if (res.points > 0) {
                           pointsRaces++;
                        }

                        raceEntries.push({
                           raceId: detail.id,
                           round: detail.round,
                           raceName: detail.name,
                           circuitName: detail.circuit?.name || null,
                           country: detail.circuit?.country || null,
                           raceDate: detail.raceDate,
                           gridPosition: grid,
                           finishPosition: finish,
                           points: res.points || 0,
                           status: res.status || 'Finished',
                           fastestLap: !!res.fastestLap,
                           positionsGained: delta,
                           sessionType: 'RACE',
                        });
                     }
                  }

                  raceEntries.sort((a, b) => a.round - b.round);

                  const totalRacesCount = raceEntries.length;
                  const avgGrid = gridCount > 0 ? Math.round((totalGrid / gridCount) * 10) / 10 : 0;
                  const avgFinish = finishCount > 0 ? Math.round((totalFinish / finishCount) * 10) / 10 : 0;
                  const pointsRate = totalRacesCount > 0 ? Math.round((pointsRaces / totalRacesCount) * 1000) / 10 : 0;

                  const performanceStats: DriverPerformanceStats = {
                     avgGrid,
                     avgFinish,
                     totalPositionsGained: totalDelta,
                     totalRaces: totalRacesCount,
                     pointsScoringRaces: pointsRaces,
                     pointsFinishRate: pointsRate,
                     dnfCount: dnfs,
                     fastestLapsCount: fastestLaps,
                     bestFinish: bestFinish ?? 0,
                     bestGrid: bestGrid ?? 0,
                  };

                  setHistory({
                     driverId: driverData.id,
                     driverCode: driverData.code,
                     driverName: `${driverData.firstName} ${driverData.lastName}`,
                     season: 2026,
                     stats: performanceStats,
                     races: raceEntries,
                     penalties: backendPenalties,
                  });
               } catch (fallbackErr) {
                  console.error('Error in fallback history aggregation:', fallbackErr);
               } finally {
                  setHistoryLoading(false);
               }
            })
            .catch((err) => {
               console.error(err);
               setLoading(false);
               setHistoryLoading(false);
            });
      }
   }, [id]);

   if (loading) return <PageSkeleton />;
   if (!driver) return null;

   const theme = resolveTheme(driver.constructorName);
   const driverImgUrl = driver.imageUrl ?? getDriverImage(theme, driver.firstName, driver.lastName);
   const showDriverImg = driverImgUrl && !imgError;

   const stats = [
      { label: 'Championship', value: `P${driver.championshipPosition}`, icon: Trophy, color: '#fbbf24', accent: 'via-amber-400' },
      { label: 'Points', value: driver.points, icon: Hash, color: '#fb6f6f', accent: 'via-f1-red' },
      { label: 'Wins', value: driver.wins, icon: Trophy, color: '#34d399', accent: 'via-emerald-400' },
      { label: 'Podiums', value: driver.podiums, icon: Medal, color: '#60a5fa', accent: 'via-blue-400' },
   ];

   const perf = history?.stats;
   const races = history?.races || [];
   const penalties = history?.penalties || [];

   const formatPenaltyMessage = (message: string) => {
      return message.replace(/\s*\(\d{1,2}:\d{2}(:\d{2})?\)\s*$/, '').trim();
   };

   // Helper for finish badge styling
   const getFinishBadgeStyle = (pos: number, status: string) => {
      const isDnf = status === 'Retired' || status === 'DNF';
      if (isDnf) {
         return 'bg-red-500/15 text-red-400 border-red-500/30';
      }
      if (pos === 1) {
         return 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.25)]';
      }
      if (pos === 2) {
         return 'bg-slate-300/20 text-slate-200 border-slate-300/30';
      }
      if (pos === 3) {
         return 'bg-amber-700/20 text-amber-500 border-amber-700/30';
      }
      if (pos <= 10) {
         return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
      }
      return 'bg-white/[0.04] text-f1-silver border-white/[0.08]';
   };

   // Helper for penalty type badge
   const getPenaltyTypeBadge = (penaltyType?: string) => {
      switch (penaltyType) {
         case 'TIME_PENALTY':
            return { label: 'Time Penalty', icon: Clock, color: 'bg-red-500/15 border-red-500/30 text-red-400' };
         case 'GRID_PENALTY':
            return { label: 'Grid Penalty', icon: LayoutGrid, color: 'bg-orange-500/15 border-orange-500/30 text-orange-400' };
         case 'DRIVE_THROUGH':
            return { label: 'Drive Through', icon: GitBranch, color: 'bg-purple-500/15 border-purple-500/30 text-purple-400' };
         case 'PITLANE_START':
            return { label: 'Pit Lane Start', icon: Flag, color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' };
         default:
            return { label: penaltyType ?? 'Penalty', icon: AlertOctagon, color: 'bg-red-500/15 border-red-500/30 text-red-400' };
      }
   };

   return (
      <div className="flex flex-col gap-5 animate-fade-in pb-10">
         {/* ─── Back Button ─── */}
         <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors shrink-0 group w-fit"
         >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-widest">Back</span>
         </button>

         {/* ─── Driver Hero HUD Card ─── */}
         <div className="telemetry-card overflow-hidden shrink-0 shadow-2xl">
            {/* Two-tone gradient hero background */}
            <div
               className="relative overflow-hidden h-[220px] sm:h-[240px] dot-grid"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 40%, ${theme.bgTo} 100%)`,
               }}
            >
               <div className="scanline-overlay" />
               {/* Dot-grid texture overlay */}
               <div
                  className="absolute inset-0 opacity-20"
                  style={{
                     backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                     backgroundSize: '18px 18px',
                  }}
               />
               {/* Right-side radial glow */}
               <div
                  className="absolute inset-0"
                  style={{
                     background: `radial-gradient(ellipse at 80% 50%, ${theme.bgTo}55 0%, transparent 65%)`,
                  }}
               />

               <div className="relative flex items-end h-full px-4 sm:px-6 pt-4 pb-0">
                  {/* Driver info */}
                  <div className="pb-4 z-10 pr-[135px] sm:pr-[240px]">
                     <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.bgTo }}>
                        #{driver.number} · {driver.constructorName}
                     </p>
                     <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-white drop-shadow-lg leading-tight">
                        {driver.firstName}
                        <br />
                        <span className="text-3xl sm:text-5xl">{driver.lastName.toUpperCase()}</span>
                     </h1>
                     <div className="flex items-center gap-3 sm:gap-4 mt-2 text-white/70 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                           <Globe className="w-3.5 h-3.5 text-white/50" />
                           {driver.nationality}
                        </span>
                        {driver.dateOfBirth && (
                           <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-white/50" />
                              {new Date(driver.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Driver image: flush right */}
                  <div className="absolute right-0 bottom-0 top-0 w-[140px] sm:w-[250px] z-10">
                     {/* Driver number watermark behind image */}
                     <span
                        className="absolute inset-0 flex items-center justify-start font-display font-black leading-none select-none pointer-events-none text-8xl sm:text-[10rem] -translate-x-6 sm:-translate-x-[90px]"
                        style={{
                           color: `${theme.bgTo}50`,
                           zIndex: 0,
                        }}
                     >
                        {driver.number}
                     </span>

                     {/* Image box */}
                     <div className="absolute inset-0 overflow-hidden z-10">
                        {showDriverImg ? (
                           <img
                              src={driverImgUrl!}
                              alt={`${driver.firstName} ${driver.lastName}`}
                              className="w-full h-full object-cover object-top select-none drop-shadow-2xl"
                              style={{
                                 transform: 'scale(1.05)',
                                 transformOrigin: 'top center',
                              }}
                              onError={() => setImgError(true)}
                           />
                        ) : (
                           <div
                              className="absolute inset-0 rounded-t-2xl flex items-end justify-center pb-4"
                              style={{ backgroundColor: `${theme.bgTo}22` }}
                           >
                              <span className="text-4xl sm:text-6xl font-display font-black text-white/20">{driver.code}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Meta bar */}
            <div className="px-6 py-2.5 flex items-center gap-4 border-t border-white/[0.06] bg-black/20">
               <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }}
               />
               <span className="text-f1-silver text-xs font-mono uppercase tracking-wider">{driver.constructorName}</span>
               <span className="text-white/30 text-xs font-mono">|</span>
               <span className="text-f1-silver/70 text-xs font-mono uppercase tracking-wider">Car #{driver.number}</span>
               <span className="ml-auto text-2xl font-display font-black text-f1-light-gray/20 tracking-wider">{driver.code}</span>
            </div>
         </div>

         {/* ─── Stats Grid (telemetry cards) ─── */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {stats.map(({ label, value, icon: Icon, color, accent }) => (
               <div key={label} className="telemetry-card p-2.5 relative overflow-hidden">
                  <div className={`absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent ${accent} to-transparent`} />
                  <div className="flex items-center gap-2">
                     <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center border border-white/[0.06] shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                     >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                     </div>
                     <div>
                        <p className="stat-value font-mono leading-tight" style={{ color }}>{value}</p>
                        <p className="stat-label text-[9px] font-mono uppercase tracking-widest text-f1-silver/50 leading-tight">{label}</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* ─── Team Info Banner ─── */}
         {driver.constructorId && (
            <Link to={`/constructors/${driver.constructorId}`} className="block shrink-0 group outline-none">
               <div className="telemetry-card p-4 cursor-pointer group-hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div
                           className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.06]"
                           style={{ backgroundColor: driver.constructorColor }}
                        >
                           {theme.teamLogoUrl && !logoError ? (
                              <img
                                 src={theme.teamLogoUrl}
                                 alt={driver.constructorName}
                                 className="w-full h-full object-contain p-1.5"
                                 onError={() => setLogoError(true)}
                              />
                           ) : (
                              <Trophy className="w-4 h-4 text-white" />
                           )}
                        </div>
                        <div>
                           <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50">Constructor Affiliation</p>
                           <p className="text-lg font-bold text-f1-white group-hover:text-amber-400 transition-colors">{driver.constructorName}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-f1-silver/50 group-hover:text-f1-silver transition-colors">Team Telemetry</span>
                        <ChevronRight className="w-4 h-4 text-f1-silver/30 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                     </div>
                  </div>
               </div>
            </Link>
         )}

         {/* ─── Driver Performance Matrix (Insights) ─── */}
         {perf && (
            <div className="space-y-2.5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Gauge className="w-4 h-4 text-emerald-400" />
                     <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-f1-silver font-bold">
                        Season Performance Telemetry
                     </h2>
                  </div>
                  <span className="text-[10px] font-mono text-f1-silver/40 uppercase tracking-widest">
                     Season 2026 · {perf.totalRaces} Grands Prix
                  </span>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Avg Grid */}
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Avg Qualifying</p>
                     <p className="text-xl font-display font-black text-white mt-1">P{perf.avgGrid}</p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">Best: P{perf.bestGrid}</p>
                  </div>

                  {/* Avg Finish */}
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Avg Finish</p>
                     <p className="text-xl font-display font-black text-emerald-400 mt-1">P{perf.avgFinish}</p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">Best: P{perf.bestFinish}</p>
                  </div>

                  {/* Net Positions Gained */}
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Positions Delta</p>
                     <div className="flex items-center gap-1.5 mt-1">
                        {perf.totalPositionsGained >= 0 ? (
                           <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                           <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <p className={`text-xl font-display font-black ${perf.totalPositionsGained >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {perf.totalPositionsGained > 0 ? `+${perf.totalPositionsGained}` : perf.totalPositionsGained}
                        </p>
                     </div>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">Race Day Gained</p>
                  </div>

                  {/* Points Finish Rate */}
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Points Rate</p>
                     <p className="text-xl font-display font-black text-amber-400 mt-1">{perf.pointsFinishRate}%</p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">{perf.pointsScoringRaces} of {perf.totalRaces} GPs</p>
                  </div>

                  {/* Fastest Laps */}
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Fastest Laps</p>
                     <div className="flex items-center gap-1.5 mt-1">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <p className="text-xl font-display font-black text-purple-400">{perf.fastestLapsCount}</p>
                     </div>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">DHL Speed Awards</p>
                  </div>

                  {/* DNFs */}
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Retirements</p>
                     <p className={`text-xl font-display font-black mt-1 ${perf.dnfCount === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {perf.dnfCount}
                     </p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">DNFs This Season</p>
                  </div>
               </div>
            </div>
         )}

         {/* ─── Nav Tabs: Race Performance vs Penalties ─── */}
         <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
            <button
               onClick={() => setActiveTab('races')}
               className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${activeTab === 'races'
                  ? 'border-f1-red text-white bg-white/[0.04] font-bold'
                  : 'border-transparent text-f1-silver/60 hover:text-f1-silver hover:bg-white/[0.02]'
                  }`}
            >
               <Flag className="w-3.5 h-3.5 text-f1-red" />
               Race Results &amp; Positions ({races.length})
            </button>

            <button
               onClick={() => setActiveTab('penalties')}
               className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${activeTab === 'penalties'
                  ? 'border-amber-400 text-white bg-white/[0.04] font-bold'
                  : 'border-transparent text-f1-silver/60 hover:text-f1-silver hover:bg-white/[0.02]'
                  }`}
            >
               <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
               Penalties &amp; Stewards Records ({penalties.length})
            </button>
         </div>

         {/* ─── TAB 1: Race Results & Positions ─── */}
         {activeTab === 'races' && (
            <div className="space-y-3">
               {races.length === 0 && !historyLoading ? (
                  <div className="telemetry-card p-8 text-center">
                     <p className="text-sm font-mono text-f1-silver/60">No race results recorded for this season yet.</p>
                  </div>
               ) : (
                  <div className="telemetry-card overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-f1-silver/60">
                                 <th className="py-3 px-4">Round</th>
                                 <th className="py-3 px-4">Grand Prix</th>
                                 <th className="py-3 px-3 text-center">Grid</th>
                                 <th className="py-3 px-4 text-center">Finish</th>
                                 <th className="py-3 px-3 text-center">Delta</th>
                                 <th className="py-3 px-4 text-center">Points</th>
                                 <th className="py-3 px-3 text-center">Fastest Lap</th>
                                 <th className="py-3 px-4 text-right">Details</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                              {races.map((race) => {
                                 const isDnf = race.status === 'Retired' || race.status === 'DNF';
                                 return (
                                    <tr
                                       key={race.raceId}
                                       className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                       onClick={() => navigate(`/races/${race.raceId}`)}
                                    >
                                       {/* Round */}
                                       <td className="py-3 px-4 text-f1-silver/60 font-mono">
                                          R{race.round.toString().padStart(2, '0')}
                                       </td>

                                       {/* Grand Prix & Circuit */}
                                       <td className="py-3 px-4">
                                          <div className="font-sans font-bold text-white group-hover:text-f1-red-light transition-colors">
                                             {race.raceName}
                                          </div>
                                          <div className="text-[10px] text-f1-silver/50 font-mono flex items-center gap-1.5 mt-0.5">
                                             <span>{race.circuitName}</span>
                                             {race.country && <span>· {race.country}</span>}
                                          </div>
                                       </td>

                                       {/* Starting Grid */}
                                       <td className="py-3 px-3 text-center font-bold">
                                          {race.gridPosition > 0 ? (
                                             <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white">
                                                P{race.gridPosition}
                                             </span>
                                          ) : (
                                             <span className="text-f1-silver/40">PL</span>
                                          )}
                                       </td>

                                       {/* Finish Position */}
                                       <td className="py-3 px-4 text-center">
                                          <span
                                             className={`inline-block px-2.5 py-0.5 rounded-full font-bold border ${getFinishBadgeStyle(
                                                race.finishPosition,
                                                race.status
                                             )}`}
                                          >
                                             {isDnf ? 'DNF' : `P${race.finishPosition}`}
                                          </span>
                                       </td>

                                       {/* Position Delta */}
                                       <td className="py-3 px-3 text-center font-bold">
                                          {race.positionsGained > 0 ? (
                                             <span className="inline-flex items-center gap-0.5 text-emerald-400 font-mono">
                                                <TrendingUp className="w-3 h-3" />
                                                +{race.positionsGained}
                                             </span>
                                          ) : race.positionsGained < 0 ? (
                                             <span className="inline-flex items-center gap-0.5 text-red-400 font-mono">
                                                <TrendingDown className="w-3 h-3" />
                                                {race.positionsGained}
                                             </span>
                                          ) : (
                                             <span className="inline-flex items-center gap-0.5 text-f1-silver/40 font-mono">
                                                <Minus className="w-3 h-3" />
                                                0
                                             </span>
                                          )}
                                       </td>

                                       {/* Points Scored */}
                                       <td className="py-3 px-4 text-center">
                                          {race.points > 0 ? (
                                             <span className="font-display font-black text-amber-400 text-sm">
                                                +{race.points}
                                             </span>
                                          ) : (
                                             <span className="text-f1-silver/30">0</span>
                                          )}
                                       </td>

                                       {/* Fastest Lap */}
                                       <td className="py-3 px-3 text-center">
                                          {race.fastestLap ? (
                                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px]">
                                                <Zap className="w-3 h-3" /> FL
                                             </span>
                                          ) : (
                                             <span className="text-f1-silver/20">—</span>
                                          )}
                                       </td>

                                       {/* View GP Link */}
                                       <td className="py-3 px-4 text-right">
                                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-f1-silver/50 group-hover:text-amber-400 transition-colors">
                                             Race Report
                                             <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                          </span>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* ─── TAB 2: Penalties & Stewards Dossier ─── */}
         {activeTab === 'penalties' && (
            <div className="space-y-3">
               {penalties.length === 0 && !historyLoading ? (
                  <div className="telemetry-card p-10 text-center relative overflow-hidden">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                     </div>
                     <h3 className="text-base font-bold text-white mb-1">Clean Record · Zero Penalties</h3>
                     <p className="text-xs font-mono text-f1-silver/60 max-w-md mx-auto">
                        No official time penalties, driver reprimands, or disciplinary sanctions have been issued against {driver.firstName} {driver.lastName} in the 2026 FIA Formula 1 World Championship.
                     </p>
                  </div>
               ) : (
                  <div className="space-y-2.5">
                     <div className="flex items-center justify-between text-xs font-mono text-f1-silver/60 px-1">
                        <span>Official FIA Stewards Decisions</span>
                        <span>{penalties.length} Penalties Logged</span>
                     </div>

                     <div className="space-y-2">
                        {penalties.map((penalty, idx) => {
                           const ptBadge = getPenaltyTypeBadge((penalty as any).penaltyType);
                           const PtIcon = ptBadge.icon;
                           return (
                              <div
                                 key={idx}
                                 className="telemetry-card p-4 border border-white/[0.08] hover:border-white/[0.15] transition-all relative overflow-hidden"
                              >
                                 {/* Left accent bar by penalty type */}
                                 <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l ${ptBadge.color.includes('orange') ? 'bg-orange-500' : ptBadge.color.includes('purple') ? 'bg-purple-500' : ptBadge.color.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                 <div className="pl-3 flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                       {/* Race badge */}
                                       <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-white font-bold">
                                          {penalty.raceName}
                                       </span>

                                       {/* Session name */}
                                       {(penalty as any).sessionName && (
                                          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-f1-silver/70">
                                             {(penalty as any).sessionName}
                                          </span>
                                       )}

                                       {/* Lap Number */}
                                       {penalty.lapNumber > 0 && (
                                          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-f1-silver">
                                             Lap {penalty.lapNumber}
                                          </span>
                                       )}

                                       {/* Penalty Type Badge */}
                                       <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${ptBadge.color}`}>
                                          <PtIcon className="w-3 h-3" />
                                          {ptBadge.label}
                                       </span>
                                    </div>

                                    {/* Penalty detail / outcome */}
                                    {(penalty as any).penaltyDetail && (
                                       <p className="text-xs font-mono font-bold text-amber-300">
                                          → {(penalty as any).penaltyDetail}
                                       </p>
                                    )}

                                    {/* Message content */}
                                    <p className="text-xs sm:text-sm text-white/80 font-mono leading-relaxed">
                                       {formatPenaltyMessage(penalty.message)}
                                    </p>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default DriverDetailPage;