import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
   ArrowLeft, Trophy, Medal, Shield, ChevronRight, Radio,
   Flag, TrendingUp, TrendingDown, Minus, Zap, Gauge,
   Users, Star, BarChart2, Award, Sparkles
} from 'lucide-react';
import { constructorService } from '../services/constructorService';
import { raceService } from '../services/raceService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import type { ConstructorDetail, RaceResult } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────

interface ConstructorRaceRound {
   raceId: number;
   round: number;
   raceName: string;
   circuitName: string | null;
   country: string | null;
   raceDate: string | null;
   driverResults: Array<{
      driverCode: string;
      driverName: string;
      finishPosition: number;
      gridPosition: number;
      points: number;
      status: string;
      fastestLap: boolean;
      positionsGained: number;
   }>;
   totalPoints: number;
   bestFinish: number;
}

interface ConstructorSeasonStats {
   totalRaces: number;
   totalPoints: number;
   wins: number;
   podiums: number;
   polePositions: number;
   fastestLaps: number;
   dnfCount: number;
   avgFinish: number;
   bestFinish: number;
   pointsScoringRaces: number;
   doublesOnPodium: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFinishBadgeStyle(pos: number, status: string) {
   const isDnf = status === 'Retired' || status === 'DNF';
   if (isDnf) return 'bg-red-500/15 text-red-400 border-red-500/30';
   if (pos === 1) return 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.25)]';
   if (pos === 2) return 'bg-slate-300/20 text-slate-200 border-slate-300/30';
   if (pos === 3) return 'bg-amber-700/20 text-amber-500 border-amber-700/30';
   if (pos <= 10) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
   return 'bg-white/[0.04] text-f1-silver border-white/[0.08]';
}

// ── Component ─────────────────────────────────────────────────────────────────

const ConstructorDetailPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const [team, setTeam] = useState<ConstructorDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [logoError, setLogoError] = useState(false);
   const [carError, setCarError] = useState(false);
   const [rounds, setRounds] = useState<ConstructorRaceRound[]>([]);
   const [seasonStats, setSeasonStats] = useState<ConstructorSeasonStats | null>(null);
   const [historyLoading, setHistoryLoading] = useState(false);
   const [activeTab, setActiveTab] = useState<'races' | 'drivers'>('races');

   useEffect(() => {
      if (!id) return;
      setLogoError(false);
      setCarError(false);
      setLoading(true);
      setHistoryLoading(true);

      constructorService.getById(Number(id))
         .then(async (teamData) => {
            setTeam(teamData);
            setLoading(false);

            // Aggregate race telemetry from completed 2026 races
            try {
               const driverCodes = new Set(teamData.drivers.map((d) => d.code));
               const driverNames = new Set(
                  teamData.drivers.map((d) => `${d.firstName} ${d.lastName}`.toLowerCase())
               );
               const driverNameMap = Object.fromEntries(
                  teamData.drivers.map((d) => [d.code, `${d.firstName} ${d.lastName}`])
               );

               const allRaces = await raceService.getAll(2026);
               const completedRaces = allRaces.filter((r) => r.status === 'COMPLETED');
               const raceDetails = await Promise.all(completedRaces.map((r) => raceService.getById(r.id)));

               const roundList: ConstructorRaceRound[] = [];
               let totalWins = 0;
               let totalPodiums = 0;
               let totalPoles = 0;
               let totalFastestLaps = 0;
               let totalDnfs = 0;
               let totalFinishSum = 0;
               let totalFinishCount = 0;
               let bestFinishOverall = 999;
               let pointsScoringEntries = 0;
               let doublesOnPodium = 0;

               for (const detail of raceDetails) {
                  const teamResults: RaceResult[] = detail.results?.filter(
                     (r) =>
                        (r.constructorName && teamData.name && r.constructorName.toLowerCase() === teamData.name.toLowerCase()) ||
                        driverCodes.has(r.driverCode) ||
                        driverNames.has(`${r.driverFirstName} ${r.driverLastName}`.toLowerCase())
                  ) ?? [];

                  if (teamResults.length === 0) continue;

                  const driverRows = teamResults.map((r) => {
                     const grid = r.gridPosition || 0;
                     const finish = r.position || 0;
                     const isDnf = r.status === 'Retired' || r.status === 'DNF';

                     if (finish > 0) {
                        totalFinishSum += finish;
                        totalFinishCount++;
                        if (finish < bestFinishOverall) bestFinishOverall = finish;
                     }
                     if (finish === 1) totalWins++;
                     if (finish <= 3 && !isDnf) totalPodiums++;
                     if (grid === 1) totalPoles++;
                     if (r.fastestLap) totalFastestLaps++;
                     if (isDnf) totalDnfs++;
                     if (r.points > 0) pointsScoringEntries++;

                     return {
                        driverCode: r.driverCode,
                        driverName: driverNameMap[r.driverCode] ?? `${r.driverFirstName} ${r.driverLastName}`,
                        finishPosition: finish,
                        gridPosition: grid,
                        points: r.points || 0,
                        status: r.status || 'Finished',
                        fastestLap: !!r.fastestLap,
                        positionsGained: grid > 0 && finish > 0 ? grid - finish : 0,
                     };
                  });

                  const podiumDrivers = driverRows.filter((r) => r.finishPosition <= 3 && r.status !== 'Retired' && r.status !== 'DNF');
                  if (podiumDrivers.length >= 2) doublesOnPodium++;

                  const totalRoundPoints = driverRows.reduce((sum, r) => sum + r.points, 0);
                  const bestRoundFinish = Math.min(...driverRows.map((r) => (r.finishPosition > 0 ? r.finishPosition : 999)));

                  roundList.push({
                     raceId: detail.id,
                     round: detail.round,
                     raceName: detail.name,
                     circuitName: detail.circuit?.name ?? null,
                     country: detail.circuit?.country ?? null,
                     raceDate: detail.raceDate,
                     driverResults: driverRows,
                     totalPoints: totalRoundPoints,
                     bestFinish: bestRoundFinish === 999 ? 0 : bestRoundFinish,
                  });
               }

               roundList.sort((a, b) => a.round - b.round);
               setRounds(roundList);

               setSeasonStats({
                  totalRaces: roundList.length,
                  totalPoints: roundList.reduce((s, r) => s + r.totalPoints, 0),
                  wins: totalWins,
                  podiums: totalPodiums,
                  polePositions: totalPoles,
                  fastestLaps: totalFastestLaps,
                  dnfCount: totalDnfs,
                  avgFinish: totalFinishCount > 0 ? Math.round((totalFinishSum / totalFinishCount) * 10) / 10 : 0,
                  bestFinish: bestFinishOverall === 999 ? 0 : bestFinishOverall,
                  pointsScoringRaces: pointsScoringEntries,
                  doublesOnPodium,
               });
            } catch (err) {
               console.error('Error loading constructor race history:', err);
            } finally {
               setHistoryLoading(false);
            }
         })
         .catch((err) => {
            console.error(err);
            setLoading(false);
            setHistoryLoading(false);
         });
   }, [id]);

   if (loading) return <PageSkeleton />;
   if (!team) return null;

   const theme = resolveTheme(team.name);

   // Head to Head driver stats calculation
   const driverA = team.drivers[0];
   const driverB = team.drivers[1];
   const totalDriverPoints = (driverA?.points ?? 0) + (driverB?.points ?? 0);
   const driverAPercent = totalDriverPoints > 0 ? Math.round(((driverA?.points ?? 0) / totalDriverPoints) * 100) : 50;
   const driverBPercent = 100 - driverAPercent;

   // Head to Head race finishes ahead
   let driverAAheadCount = 0;
   let driverBAheadCount = 0;
   if (driverA && driverB) {
      rounds.forEach((rnd) => {
         const resA = rnd.driverResults.find((r) => r.driverCode === driverA.code);
         const resB = rnd.driverResults.find((r) => r.driverCode === driverB.code);
         if (resA && resB && resA.finishPosition > 0 && resB.finishPosition > 0) {
            if (resA.finishPosition < resB.finishPosition) driverAAheadCount++;
            else if (resB.finishPosition < resA.finishPosition) driverBAheadCount++;
         }
      });
   }

   const stats = [
      { label: 'Championship', value: `P${team.championshipPosition}`, icon: Trophy, color: '#fbbf24', accent: 'via-amber-400' },
      { label: 'Points', value: team.points, icon: Medal, color: '#fb6f6f', accent: 'via-f1-red' },
      { label: 'Wins', value: team.wins, icon: Trophy, color: '#34d399', accent: 'via-emerald-400' },
      { label: 'Podiums', value: seasonStats?.podiums ?? 0, icon: Star, color: '#60a5fa', accent: 'via-blue-400' },
   ];

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

         {/* ─── Team Hero HUD Card ─── */}
         <div className="telemetry-card overflow-hidden shrink-0 shadow-2xl">
            {/* Two-tone gradient hero */}
            <div
               className="relative overflow-hidden dot-grid"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 35%, ${theme.bgTo} 100%)`,
               }}
            >
               <div className="scanline-overlay" />
               <div
                  className="absolute inset-0 opacity-20"
                  style={{
                     backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                     backgroundSize: '18px 18px',
                  }}
               />
               <div
                  className="absolute inset-0"
                  style={{
                     background: `radial-gradient(ellipse at 85% 50%, ${theme.bgTo}55 0%, transparent 60%)`,
                  }}
               />

               {/* Status pill */}
               <div className="absolute top-3 sm:top-4 left-4 sm:left-6 z-10 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/25 border border-white/15 backdrop-blur-md">
                  <Radio className="w-3 h-3 text-white/80" />
                  <span className="text-white/80 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                     Constructor Telemetry
                  </span>
               </div>

               <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between min-h-[180px] sm:min-h-[210px] px-4 sm:px-6 pt-12 pb-3 sm:pb-4 gap-2">
                  {/* Team info */}
                  <div className="z-10 min-w-0 w-full sm:flex-1">
                     {/* Team logo */}
                     {!logoError && (team.logoUrl ?? theme.teamLogoUrl) ? (
                        <img
                           src={team.logoUrl ?? theme.teamLogoUrl}
                           alt={team.name}
                           className="h-6 sm:h-9 w-auto object-contain mb-1.5 sm:mb-2 drop-shadow-lg"
                           onError={() => setLogoError(true)}
                        />
                     ) : null}
                     <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-white drop-shadow-lg uppercase leading-tight">
                        {team.name}
                     </h1>
                     <div className="flex items-center gap-3 mt-1.5 text-white/60 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                        <span>{team.nationality}</span>
                        <span className="text-white/20">·</span>
                        <span>{team.drivers.length} Drivers</span>
                        {seasonStats && (
                           <>
                              <span className="text-white/20">·</span>
                              <span style={{ color: theme.bgTo }}>{seasonStats.totalRaces} Grands Prix</span>
                           </>
                        )}
                     </div>
                  </div>

                  {/* Car image */}
                  {!carError && (
                     <img
                        src={theme.carImageUrl}
                        alt={`${team.name} 2026 car`}
                        className="h-20 sm:h-56 max-w-[300px] sm:max-w-[500px] object-contain object-right-bottom self-end sm:self-auto relative z-10 drop-shadow-2xl select-none shrink-0 ml-auto sm:ml-0"
                        onError={() => setCarError(true)}
                     />
                  )}
               </div>
            </div>

            {/* Meta bar */}
            <div className="px-4 sm:px-6 py-2.5 flex items-center gap-4 border-t border-white/[0.06] bg-black/20">
               <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
               />
               <span className="text-f1-silver text-xs font-mono uppercase tracking-wider">{team.nationality}</span>
               <span className="text-white/20 text-xs font-mono">|</span>
               <span className="text-f1-silver/70 text-xs font-mono uppercase tracking-wider">
                  FIA Formula 1 World Championship 2026
               </span>
               <span
                  className="ml-auto text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                  style={{ color: theme.primary }}
               >
                  P{team.championshipPosition} · {team.points} PTS
               </span>
            </div>
         </div>

         {/* ─── Quick Stat Cards ─── */}
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

         {/* ─── Season Performance Telemetry Matrix ─── */}
         {seasonStats && (
            <div className="space-y-2.5">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Gauge className="w-4 h-4 text-emerald-400" />
                     <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-f1-silver font-bold">
                        Season Performance Telemetry
                     </h2>
                  </div>
                  <span className="text-[10px] font-mono text-f1-silver/40 uppercase tracking-widest">
                     2026 · {seasonStats.totalRaces} Grands Prix
                  </span>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Avg Finish</p>
                     <p className="text-xl font-display font-black text-emerald-400 mt-1">P{seasonStats.avgFinish}</p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">Best: P{seasonStats.bestFinish}</p>
                  </div>

                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Pole Positions</p>
                     <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-4 h-4 text-amber-400" />
                        <p className="text-xl font-display font-black text-amber-400">{seasonStats.polePositions}</p>
                     </div>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">Front Row P1</p>
                  </div>

                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Fastest Laps</p>
                     <div className="flex items-center gap-1.5 mt-1">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <p className="text-xl font-display font-black text-purple-400">{seasonStats.fastestLaps}</p>
                     </div>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">DHL Speed Awards</p>
                  </div>

                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Double Podiums</p>
                     <div className="flex items-center gap-1.5 mt-1">
                        <Users className="w-4 h-4 text-sky-400" />
                        <p className="text-xl font-display font-black text-sky-400">{seasonStats.doublesOnPodium}</p>
                     </div>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">Both On Podium</p>
                  </div>

                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Points Entries</p>
                     <p className="text-xl font-display font-black text-f1-white mt-1">{seasonStats.pointsScoringRaces}</p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">
                        of {seasonStats.totalRaces * team.drivers.length} Car Entries
                     </p>
                  </div>

                  <div className="telemetry-card p-3 relative overflow-hidden">
                     <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Retirements</p>
                     <p className={`text-xl font-display font-black mt-1 ${seasonStats.dnfCount === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {seasonStats.dnfCount}
                     </p>
                     <p className="text-[10px] font-mono text-f1-silver/40 mt-0.5">DNFs This Season</p>
                  </div>
               </div>
            </div>
         )}

         {/* ─── Tab Navigation ─── */}
         <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
            <button
               onClick={() => setActiveTab('races')}
               className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${activeTab === 'races'
                  ? 'border-f1-red text-white bg-white/[0.04] font-bold'
                  : 'border-transparent text-f1-silver/60 hover:text-f1-silver hover:bg-white/[0.02]'
                  }`}
            >
               <Flag className="w-3.5 h-3.5 text-f1-red" />
               Race Results &amp; Positions ({rounds.length})
            </button>
            <button
               onClick={() => setActiveTab('drivers')}
               className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${activeTab === 'drivers'
                  ? 'border-amber-400 text-white bg-white/[0.04] font-bold'
                  : 'border-transparent text-f1-silver/60 hover:text-f1-silver hover:bg-white/[0.02]'
                  }`}
            >
               <Shield className="w-3.5 h-3.5 text-amber-400" />
               Driver Lineup &amp; Head-to-Head ({team.drivers.length})
            </button>
         </div>

         {/* ─── TAB 1: Race Results ─── */}
         {activeTab === 'races' && (
            <div className="space-y-3">
               {historyLoading ? (
                  <div className="telemetry-card p-8 flex flex-col items-center justify-center gap-3 animate-pulse">
                     <div className="w-8 h-8 rounded-full border-2 border-f1-red border-t-transparent animate-spin" />
                     <p className="text-xs font-mono text-f1-silver/50 uppercase tracking-widest">Loading race data…</p>
                  </div>
               ) : rounds.length === 0 ? (
                  <div className="telemetry-card p-8 text-center">
                     <BarChart2 className="w-8 h-8 text-f1-silver/20 mx-auto mb-3" />
                     <p className="text-sm font-mono text-f1-silver/60">No race results recorded for this season yet.</p>
                  </div>
               ) : (
                  <>
                     {/* Mobile: stacked cards */}
                     <div className="sm:hidden space-y-3">
                        {rounds.map((round) => (
                           <div
                              key={round.raceId}
                              className="telemetry-card p-4 relative overflow-hidden cursor-pointer active:bg-white/[0.03] transition-colors"
                              onClick={() => navigate(`/races/${round.raceId}`)}
                           >
                              <div className="flex items-start justify-between mb-3">
                                 <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                       <span className="text-[10px] font-mono text-f1-silver/50">
                                          R{round.round.toString().padStart(2, '0')}
                                       </span>
                                       <h3 className="font-bold text-white text-sm">{round.raceName}</h3>
                                    </div>
                                    <p className="text-[10px] text-f1-silver/50 font-mono">
                                       {round.circuitName}{round.country && ` · ${round.country}`}
                                    </p>
                                 </div>
                                 <div className="text-right shrink-0 ml-3">
                                    <p className="font-display font-black text-lg" style={{ color: theme.primary }}>
                                       +{round.totalPoints}
                                    </p>
                                    <p className="text-[9px] font-mono text-f1-silver/40 uppercase">PTS</p>
                                 </div>
                              </div>

                              {/* Per-driver results */}
                              <div className="space-y-2">
                                 {round.driverResults.map((dr) => {
                                    const isDnf = dr.status === 'Retired' || dr.status === 'DNF';
                                    return (
                                       <div key={dr.driverCode} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2.5 py-2">
                                          <span className="text-[11px] font-mono font-bold text-white w-9 shrink-0">
                                             {dr.driverCode}
                                          </span>
                                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getFinishBadgeStyle(dr.finishPosition, dr.status)}`}>
                                             {isDnf ? 'DNF' : `P${dr.finishPosition}`}
                                          </span>
                                          {dr.gridPosition > 0 && (
                                             <span className="text-[9px] font-mono text-f1-silver/40">
                                                Grid P{dr.gridPosition}
                                             </span>
                                          )}
                                          <div className="ml-auto flex items-center gap-2">
                                             {dr.positionsGained > 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-mono">
                                                   <TrendingUp className="w-3 h-3" />+{dr.positionsGained}
                                                </span>
                                             )}
                                             {dr.positionsGained < 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-red-400 text-[10px] font-mono">
                                                   <TrendingDown className="w-3 h-3" />{dr.positionsGained}
                                                </span>
                                             )}
                                             {dr.positionsGained === 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-f1-silver/40 text-[10px] font-mono">
                                                   <Minus className="w-3 h-3" />0
                                                </span>
                                             )}
                                             {dr.fastestLap && <Zap className="w-3 h-3 text-purple-400 shrink-0" />}
                                             <span className="text-amber-400 font-mono font-bold text-[10px]">
                                                +{dr.points}
                                             </span>
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Desktop: full table */}
                     <div className="hidden sm:block telemetry-card overflow-hidden">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-f1-silver/60">
                                    <th className="py-3 px-4">Round</th>
                                    <th className="py-3 px-4">Grand Prix</th>
                                    {team.drivers.map((d) => (
                                       <th key={d.id} className="py-3 px-4 text-center">{d.code} ({d.lastName})</th>
                                    ))}
                                    <th className="py-3 px-4 text-center">Team Points</th>
                                    <th className="py-3 px-4 text-right">Race Report</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                                 {rounds.map((round) => (
                                    <tr
                                       key={round.raceId}
                                       className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                       onClick={() => navigate(`/races/${round.raceId}`)}
                                    >
                                       <td className="py-3 px-4 text-f1-silver/60">
                                          R{round.round.toString().padStart(2, '0')}
                                       </td>
                                       <td className="py-3 px-4">
                                          <div className="font-sans font-bold text-white group-hover:text-f1-red-light transition-colors">
                                             {round.raceName}
                                          </div>
                                          <div className="text-[10px] text-f1-silver/50 font-mono mt-0.5">
                                             {round.circuitName}{round.country && ` · ${round.country}`}
                                          </div>
                                       </td>
                                       {team.drivers.map((d) => {
                                          const dr = round.driverResults.find((r) => r.driverCode === d.code);
                                          if (!dr) return <td key={d.id} className="py-3 px-4 text-center text-f1-silver/30">—</td>;
                                          const isDnf = dr.status === 'Retired' || dr.status === 'DNF';
                                          return (
                                             <td key={d.id} className="py-3 px-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                   <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${getFinishBadgeStyle(dr.finishPosition, dr.status)}`}>
                                                      {isDnf ? 'DNF' : `P${dr.finishPosition}`}
                                                   </span>
                                                   <div className="flex items-center gap-1.5 text-[9px]">
                                                      {dr.gridPosition > 0 && (
                                                         <span className="text-f1-silver/40">G:P{dr.gridPosition}</span>
                                                      )}
                                                      {dr.positionsGained > 0 && (
                                                         <span className="text-emerald-400 font-bold">+{dr.positionsGained}</span>
                                                      )}
                                                      {dr.positionsGained < 0 && (
                                                         <span className="text-red-400 font-bold">{dr.positionsGained}</span>
                                                      )}
                                                      {dr.fastestLap && <Zap className="w-2.5 h-2.5 text-purple-400" />}
                                                   </div>
                                                </div>
                                             </td>
                                          );
                                       })}
                                       <td className="py-3 px-4 text-center">
                                          <span className="font-display font-black text-sm" style={{ color: theme.primary }}>
                                             +{round.totalPoints}
                                          </span>
                                       </td>
                                       <td className="py-3 px-4 text-right">
                                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-f1-silver/50 group-hover:text-amber-400 transition-colors">
                                             Report <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                          </span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </>
               )}
            </div>
         )}

         {/* ─── TAB 2: Driver Lineup & Head to Head ─── */}
         {activeTab === 'drivers' && (
            <div className="space-y-4">
               {/* Head to Head Points Breakdown Bar (if 2 drivers) */}
               {driverA && driverB && (
                  <div className="telemetry-card p-4 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <Award className="w-4 h-4 text-amber-400" />
                           <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white font-bold">
                              Teammate Head-to-Head Comparison
                           </h3>
                        </div>
                        <span className="text-[10px] font-mono text-f1-silver/50 uppercase tracking-wider">
                           Points Contribution Share
                        </span>
                     </div>

                     {/* Visual comparison bar */}
                     <div className="relative mb-3">
                        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                           <span className="font-bold text-white flex items-center gap-1.5">
                              {driverA.firstName} {driverA.lastName}
                              <span className="text-amber-400">({driverA.points} PTS · {driverAPercent}%)</span>
                           </span>
                           <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="text-sky-400">({driverB.points} PTS · {driverBPercent}%)</span>
                              {driverB.firstName} {driverB.lastName}
                           </span>
                        </div>
                        <div className="h-2.5 w-full bg-white/[0.06] rounded-full overflow-hidden flex">
                           <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                              style={{ width: `${driverAPercent}%` }}
                           />
                           <div
                              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500"
                              style={{ width: `${driverBPercent}%` }}
                           />
                        </div>
                     </div>

                     {/* Metric comparison cards */}
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/[0.06]">
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                           <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Race Finishes Ahead</p>
                           <p className="text-sm font-mono font-bold text-white mt-0.5">
                              <span className="text-amber-400">{driverAAheadCount}</span> — <span className="text-sky-400">{driverBAheadCount}</span>
                           </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                           <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Season Wins</p>
                           <p className="text-sm font-mono font-bold text-white mt-0.5">
                              <span className="text-amber-400">{driverA.wins}</span> — <span className="text-sky-400">{driverB.wins}</span>
                           </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                           <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Podiums</p>
                           <p className="text-sm font-mono font-bold text-white mt-0.5">
                              <span className="text-amber-400">{driverA.podiums}</span> — <span className="text-sky-400">{driverB.podiums}</span>
                           </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                           <p className="text-[9px] font-mono uppercase tracking-widest text-f1-silver/50">Standings Rank</p>
                           <p className="text-sm font-mono font-bold text-white mt-0.5">
                              <span className="text-amber-400">P{driverA.championshipPosition}</span> — <span className="text-sky-400">P{driverB.championshipPosition}</span>
                           </p>
                        </div>
                     </div>
                  </div>
               )}

               {/* Driver cards grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {team.drivers.map((driver) => {
                     const driverImgUrl = driver.imageUrl ?? getDriverImage(theme, driver.firstName, driver.lastName);
                     return (
                        <Link key={driver.id} to={`/drivers/${driver.id}`} className="group outline-none">
                           <div className="telemetry-card overflow-hidden cursor-pointer group-hover:border-white/[0.15] transition-all duration-300">
                              {/* Mini hero gradient */}
                              <div
                                 className="relative h-32 overflow-hidden"
                                 style={{ background: `linear-gradient(to right, ${theme.bgFrom}, ${theme.bgTo})` }}
                              >
                                 <div
                                    className="absolute inset-0 opacity-20"
                                    style={{
                                       backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                                       backgroundSize: '14px 14px',
                                    }}
                                 />
                                 {/* Driver number watermark */}
                                 <span
                                    className="absolute left-4 bottom-3 font-display font-black text-6xl leading-none select-none pointer-events-none"
                                    style={{ color: `${theme.bgTo}40` }}
                                 >
                                    {driver.number}
                                 </span>
                                 {driverImgUrl && (
                                    <div className="absolute right-0 bottom-0 h-32 w-28 overflow-hidden">
                                       <img
                                          src={driverImgUrl}
                                          alt={`${driver.firstName} ${driver.lastName}`}
                                          className="absolute top-0 left-0 w-full object-cover object-top drop-shadow-xl select-none"
                                          style={{ height: '200%', transform: 'scale(1.25)', transformOrigin: 'top center' }}
                                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                       />
                                    </div>
                                 )}
                                 <div className="absolute left-4 bottom-3 z-10">
                                    <p className="text-2xl font-display font-black text-white">#{driver.number}</p>
                                    <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">{driver.code}</p>
                                 </div>
                              </div>

                              <div className="p-4 border-t border-white/[0.06]">
                                 <div className="flex items-start justify-between">
                                    <div>
                                       <p className="font-bold text-base text-f1-white group-hover:text-amber-400 transition-colors">
                                          {driver.firstName} {driver.lastName}
                                       </p>
                                       <p className="text-f1-silver/60 text-[10px] font-mono uppercase tracking-wider mt-0.5">
                                          {driver.nationality}
                                       </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-f1-silver/30 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all mt-1" />
                                 </div>

                                 {/* Driver stats row */}
                                 <div className="grid grid-cols-4 gap-2 mt-3">
                                    <div className="text-center bg-white/[0.03] rounded-lg py-2 border border-white/[0.05]">
                                       <p className="font-display font-black text-amber-400 text-base leading-tight">{driver.points}</p>
                                       <p className="text-[8px] font-mono uppercase tracking-widest text-f1-silver/40 mt-0.5">PTS</p>
                                    </div>
                                    <div className="text-center bg-white/[0.03] rounded-lg py-2 border border-white/[0.05]">
                                       <p className="font-display font-black text-emerald-400 text-base leading-tight">{driver.wins}</p>
                                       <p className="text-[8px] font-mono uppercase tracking-widest text-f1-silver/40 mt-0.5">Wins</p>
                                    </div>
                                    <div className="text-center bg-white/[0.03] rounded-lg py-2 border border-white/[0.05]">
                                       <p className="font-display font-black text-sky-400 text-base leading-tight">{driver.podiums}</p>
                                       <p className="text-[8px] font-mono uppercase tracking-widest text-f1-silver/40 mt-0.5">Podiums</p>
                                    </div>
                                    <div className="text-center bg-white/[0.03] rounded-lg py-2 border border-white/[0.05]">
                                       <p className="font-display font-black text-f1-white text-base leading-tight">P{driver.championshipPosition}</p>
                                       <p className="text-[8px] font-mono uppercase tracking-widest text-f1-silver/40 mt-0.5">Champ</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </Link>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
   );
};

export default ConstructorDetailPage;