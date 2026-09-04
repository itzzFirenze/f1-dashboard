import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
   Swords, Users, Trophy, Flag, Timer, ChevronRight, X,
   Zap, ShieldAlert, Award, TrendingUp
} from 'lucide-react';
import PageHeroTitle from '../components/ui/PageHeroTitle';
import SeasonSelector from '../components/ui/SeasonSelector';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import {
   teammateBattleService,
   TeammateBattle,
   SeasonBattlesResult,
   RoundDuel
} from '../services/teammateBattleService';

const TeammateBattlesPage: React.FC = () => {
   const [season, setSeason] = useState<number>(2026);
   const [battles, setBattles] = useState<TeammateBattle[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedTeamBattle, setSelectedTeamBattle] = useState<TeammateBattle | null>(null);

   useEffect(() => {
      setLoading(true);
      teammateBattleService.getSeasonBattles(season)
         .then((res: SeasonBattlesResult) => {
            setBattles(res.battles);
         })
         .catch(console.error)
         .finally(() => setLoading(false));
   }, [season]);

   useEffect(() => {
      if (selectedTeamBattle) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = '';
      }
      return () => {
         document.body.style.overflow = '';
      };
   }, [selectedTeamBattle]);

   const DuelBar = ({
      val1,
      val2,
      label,
      color1,
      color2,
      subLabel1,
      subLabel2
   }: {
      val1: number;
      val2: number;
      label: string;
      color1: string;
      color2: string;
      subLabel1?: string;
      subLabel2?: string;
   }) => {
      const total = val1 + val2 || 1;
      const pct1 = Math.round((val1 / total) * 100);
      const pct2 = 100 - pct1;

      return (
         <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
               <span className="font-bold flex items-center gap-1.5" style={{ color: color1 }}>
                  <span>{val1}</span>
                  {subLabel1 && <span className="text-[10px] opacity-70 font-normal">({subLabel1})</span>}
               </span>
               <span className="text-[10px] text-f1-silver/50 uppercase tracking-widest font-semibold">{label}</span>
               <span className="font-bold flex items-center gap-1.5" style={{ color: color2 }}>
                  {subLabel2 && <span className="text-[10px] opacity-70 font-normal">({subLabel2})</span>}
                  <span>{val2}</span>
               </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden flex border border-white/[0.04]">
               <div
                  className="h-full transition-all duration-700 rounded-l-full"
                  style={{ width: `${pct1}%`, backgroundColor: color1 }}
               />
               <div
                  className="h-full transition-all duration-700 rounded-r-full ml-0.5"
                  style={{ width: `${pct2}%`, backgroundColor: color2 }}
               />
            </div>
         </div>
      );
   };

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <Users className="w-3.5 h-3.5 text-f1-red-light" />
                     <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        Intra-Team Rivalry
                     </span>
                  </div>

                  <PageHeroTitle titlePrefix="Teammate" titleAccent="Head-to-Head Battles" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-2xl font-medium leading-relaxed hidden sm:block">
                     Comprehensive intra-team garage war: Qualifying time deltas, race duel records, points share %, and round-by-round statistics across all {battles.length || 10} constructors.
                  </p>
               </div>

               <SeasonSelector
                  selectedSeason={season}
                  onSelectSeason={(yr) => setSeason(yr || 2026)}
                  label="Select Season"
               />
            </div>
         </div>

         {loading && <PageSkeleton />}

         {/* ─── 10 Team Duel Cards Grid ─── */}
         {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
               {battles.map((battle) => {
                  const teamColor = battle.constructor.color || '#E10600';
                  const d1Color = teamColor;
                  const d2Color = '#94A3B8';

                  const isD1AheadQuali = battle.qualiH2H1 > battle.qualiH2H2;
                  const isD1AheadRace = battle.raceH2H1 > battle.raceH2H2;

                  return (
                     <div
                        key={battle.constructor.id}
                        className="telemetry-card p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between transition-all hover:border-white/20 group"
                     >
                        <div
                           className="absolute top-0 inset-x-0 h-[3px]"
                           style={{ background: `linear-gradient(90deg, transparent, ${teamColor}, transparent)` }}
                        />

                        <div>
                           {/* Team Header */}
                           <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                              <div className="flex items-center gap-3">
                                 <div
                                    className="w-3.5 h-3.5 rounded-full"
                                    style={{ backgroundColor: teamColor }}
                                 />
                                 <h3 className="text-lg font-display font-black text-f1-white uppercase tracking-tight">
                                    {battle.constructor.name}
                                 </h3>
                              </div>
                              <button
                                 onClick={() => setSelectedTeamBattle(battle)}
                                 className="text-xs font-mono font-bold text-f1-silver/70 hover:text-f1-red-light flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                              >
                                 Round Duel Matrix <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                           </div>

                           {/* Drivers Facing Banner */}
                           <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/[0.06] mb-5">
                              {/* Driver 1 */}
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-display font-black text-base text-f1-white shrink-0">
                                    {battle.driver1.code}
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="text-sm font-display font-bold text-f1-white truncate">
                                       {battle.driver1.firstName} {battle.driver1.lastName}
                                    </h4>
                                    <p className="text-xs font-mono font-bold text-amber-400">
                                       {battle.points1} pts <span className="text-f1-silver/50 font-normal">({battle.pointsShare1}%)</span>
                                    </p>
                                 </div>
                              </div>

                              {/* Driver 2 */}
                              <div className="flex items-center gap-3 justify-end text-right">
                                 <div className="min-w-0">
                                    <h4 className="text-sm font-display font-bold text-f1-white truncate">
                                       {battle.driver2.firstName} {battle.driver2.lastName}
                                    </h4>
                                    <p className="text-xs font-mono font-bold text-amber-400">
                                       {battle.points2} pts <span className="text-f1-silver/50 font-normal">({battle.pointsShare2}%)</span>
                                    </p>
                                 </div>
                                 <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-display font-black text-base text-f1-white shrink-0">
                                    {battle.driver2.code}
                                 </div>
                              </div>
                           </div>

                           {/* Duel Bars */}
                           <div className="space-y-4">
                              <DuelBar
                                 val1={battle.qualiH2H1}
                                 val2={battle.qualiH2H2}
                                 label="Qualifying Duel"
                                 color1={d1Color}
                                 color2={d2Color}
                                 subLabel1={battle.avgQualiGapMs < 0 ? `${Math.abs(battle.avgQualiGapMs)}ms faster` : undefined}
                                 subLabel2={battle.avgQualiGapMs > 0 ? `${Math.abs(battle.avgQualiGapMs)}ms faster` : undefined}
                              />

                              <DuelBar
                                 val1={battle.raceH2H1}
                                 val2={battle.raceH2H2}
                                 label="Race Finish Duel"
                                 color1={d1Color}
                                 color2={d2Color}
                              />

                              <DuelBar
                                 val1={battle.points1}
                                 val2={battle.points2}
                                 label="Points Distribution"
                                 color1={d1Color}
                                 color2={d2Color}
                                 subLabel1={`${battle.pointsShare1}%`}
                                 subLabel2={`${battle.pointsShare2}%`}
                              />
                           </div>
                        </div>

                        {/* Summary Footer Matrix */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-5 border-t border-white/[0.06] text-center text-xs font-mono">
                           <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <span className="text-[9px] font-mono text-f1-silver/50 uppercase block">Wins</span>
                              <span className="font-bold text-f1-white">{battle.wins1} vs {battle.wins2}</span>
                           </div>
                           <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <span className="text-[9px] font-mono text-f1-silver/50 uppercase block">Podiums</span>
                              <span className="font-bold text-f1-white">{battle.podiums1} vs {battle.podiums2}</span>
                           </div>
                           <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <span className="text-[9px] font-mono text-f1-silver/50 uppercase block">Avg Finish</span>
                              <span className="font-bold text-f1-white">P{battle.avgFinish1} vs P{battle.avgFinish2}</span>
                           </div>
                           <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              <span className="text-[9px] font-mono text-f1-silver/50 uppercase block">DNFs</span>
                              <span className="font-bold text-f1-white">{battle.dnfs1} vs {battle.dnfs2}</span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {/* ─── Detailed Round-by-Round Duel Modal ─── */}
         {selectedTeamBattle && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-lg animate-fade-in">
               <div className="bg-f1-carbon border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[88vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                  <div
                     className="absolute top-0 inset-x-0 h-1"
                     style={{ backgroundColor: selectedTeamBattle.constructor.color || '#E10600' }}
                  />

                  {/* Modal Header */}
                  <div className="p-4 sm:p-6 border-b border-white/[0.08] flex items-start sm:items-center justify-between gap-3">
                     <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                           className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0 mt-1 sm:mt-0"
                           style={{ backgroundColor: selectedTeamBattle.constructor.color || '#E10600' }}
                        />
                        <div className="min-w-0">
                           <h3 className="text-base sm:text-xl font-display font-black text-f1-white uppercase leading-tight">
                              {selectedTeamBattle.constructor.name}
                              <span className="hidden sm:inline"> - Round-by-Round Duel Matrix</span>
                              <span className="sm:hidden block text-xs font-mono font-bold text-f1-silver/60 uppercase tracking-widest mt-0.5">
                                 Round Duel Matrix
                              </span>
                           </h3>
                           <p className="text-[11px] sm:text-xs font-mono text-f1-silver/60 mt-0.5">
                              {selectedTeamBattle.driver1.firstName} {selectedTeamBattle.driver1.lastName} ({selectedTeamBattle.driver1.code}) vs {selectedTeamBattle.driver2.firstName} {selectedTeamBattle.driver2.lastName} ({selectedTeamBattle.driver2.code})
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => setSelectedTeamBattle(null)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-f1-silver hover:text-white transition-colors shrink-0"
                     >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                     </button>
                  </div>

                  {/* Duel Table */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
                     {/* Column headers - desktop only, mobile cards carry their own labels */}
                     <div className="hidden sm:grid grid-cols-12 text-[10px] font-mono font-bold uppercase tracking-widest text-f1-silver/50 pb-2 px-3 border-b border-white/[0.06]">
                        <span className="col-span-1">Rnd</span>
                        <span className="col-span-4">Grand Prix</span>
                        <span className="col-span-3 text-center">Qualifying ({selectedTeamBattle.driver1.code} vs {selectedTeamBattle.driver2.code})</span>
                        <span className="col-span-4 text-center">Race Result ({selectedTeamBattle.driver1.code} vs {selectedTeamBattle.driver2.code})</span>
                     </div>

                     {selectedTeamBattle.duels.map((duel) => {
                        const isQ1Winner = duel.qualiWinner === 1;
                        const isQ2Winner = duel.qualiWinner === 2;
                        const isR1Winner = duel.raceWinner === 1;

                        return (
                           <div
                              key={duel.round}
                              className="flex flex-col gap-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] text-xs font-mono transition-colors"
                           >
                              {/* Round + race name */}
                              <div className="flex items-baseline gap-2 sm:contents">
                                 <span className="text-f1-silver/50 font-bold sm:col-span-1">R{duel.round}</span>
                                 <span className="text-f1-white font-semibold truncate sm:col-span-4">{duel.raceName}</span>
                              </div>

                              {/* Quali + Race comparisons */}
                              <div className="flex items-center justify-between gap-2 sm:contents">
                                 {/* Quali comparison */}
                                 <div className="flex flex-col items-center gap-1 sm:col-span-3 sm:flex-row sm:justify-center sm:gap-2">
                                    <span className="sm:hidden text-[9px] text-f1-silver/40 uppercase tracking-widest">Quali</span>
                                    <div className="flex items-center gap-2">
                                       <span className={`px-2 py-0.5 rounded font-bold ${isQ1Winner ? 'bg-emerald-500/20 text-emerald-400' : 'text-f1-silver/70'}`}>
                                          P{duel.qualiPos1 || '—'}
                                       </span>
                                       <span className="text-f1-silver/40">vs</span>
                                       <span className={`px-2 py-0.5 rounded font-bold ${isQ2Winner ? 'bg-emerald-500/20 text-emerald-400' : 'text-f1-silver/70'}`}>
                                          P{duel.qualiPos2 || '—'}
                                       </span>
                                    </div>
                                 </div>

                                 {/* Race result comparison */}
                                 <div className="flex flex-col items-center gap-1 sm:col-span-4 sm:flex-row sm:justify-center sm:gap-2">
                                    <span className="sm:hidden text-[9px] text-f1-silver/40 uppercase tracking-widest">Race</span>
                                    <div className="flex items-center gap-2">
                                       <span className={`px-2 py-0.5 rounded font-bold ${isR1Winner ? 'bg-amber-500/20 text-amber-400' : 'text-f1-silver/70'}`}>
                                          {duel.racePos1 ? `P${duel.racePos1}` : 'DNF'}
                                       </span>
                                       <span className="text-f1-silver/40">vs</span>
                                       <span className={`px-2 py-0.5 rounded font-bold ${duel.raceWinner === 2 ? 'bg-amber-500/20 text-amber-400' : 'text-f1-silver/70'}`}>
                                          {duel.racePos2 ? `P${duel.racePos2}` : 'DNF'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>,
            document.body
         )}
      </div>
   );
};

export default TeammateBattlesPage;
