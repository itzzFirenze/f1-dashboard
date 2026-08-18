import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Shield, ChevronRight, Radio } from 'lucide-react';
import { constructorService } from '../services/constructorService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import type { ConstructorDetail } from '../types';

const ConstructorDetailPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const [team, setTeam] = useState<ConstructorDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [logoError, setLogoError] = useState(false);
   const [carError, setCarError] = useState(false);

   useEffect(() => {
      if (id) {
         setLogoError(false);
         setCarError(false);
         constructorService.getById(Number(id))
            .then(setTeam)
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [id]);

   if (loading) return <PageSkeleton />;
   if (!team) return null;

   const theme = resolveTheme(team.name);

   return (
      <div className="h-full flex flex-col gap-3 animate-fade-in overflow-hidden">
         <Link to="/constructors" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors shrink-0 group w-fit">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-widest">Back to Standings</span>
         </Link>

         {/* ─── Team Hero HUD Card ─── */}
         <div className="telemetry-card overflow-hidden shrink-0">
            {/* Two-tone gradient hero */}
            <div
               className="relative overflow-hidden dot-grid"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 35%, ${theme.bgTo} 100%)`,
                  minHeight: '130px',
               }}
            >
               <div className="scanline-overlay" />
               {/* Dot-grid texture */}
               <div
                  className="absolute inset-0 opacity-20"
                  style={{
                     backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                     backgroundSize: '18px 18px',
                  }}
               />
               {/* Right glow */}
               <div
                  className="absolute inset-0"
                  style={{
                     background: `radial-gradient(ellipse at 85% 50%, ${theme.bgTo}55 0%, transparent 60%)`,
                  }}
               />

               {/* Status pill */}
               <div className="absolute top-4 left-6 z-10 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/25 border border-white/15 backdrop-blur-md">
                  <Radio className="w-3 h-3 text-white/80" />
                  <span className="text-white/80 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                     Constructor Telemetry
                  </span>
               </div>

               <div className="relative flex items-end justify-between h-full px-6 pt-1 pb-0">
                  {/* Team info */}
                  <div className="pb-4 z-10">
                     {/* Team logo — bigger */}
                     {!logoError && (team.logoUrl ?? theme.teamLogoUrl) ? (
                        <img
                           src={team.logoUrl ?? theme.teamLogoUrl}
                           alt={team.name}
                           className="h-4 sm:h-8 w-auto object-contain mb-2 drop-shadow-lg"
                           onError={() => setLogoError(true)}
                        />
                     ) : null}
                     <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white drop-shadow-lg uppercase">
                        {team.name}
                     </h1>
                     <p className="text-white/50 text-xs font-mono uppercase tracking-widest mt-1">{team.nationality}</p>
                  </div>

                  {/* Car image — kept large */}
                  {!carError && (
                     <img
                        src={theme.carImageUrl}
                        alt={`${team.name} 2026 car`}
                        className="h-36 sm:h-52 object-contain object-right-bottom relative z-10 drop-shadow-2xl select-none"
                        style={{ maxWidth: '480px' }}
                        onError={() => setCarError(true)}
                     />
                  )}
               </div>
            </div>

            {/* Meta bar */}
            <div className="px-6 py-2.5 flex items-center gap-4 border-t border-white/[0.06]">
               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }} />
               <span className="text-f1-silver text-xs font-mono uppercase tracking-wider">{team.nationality}</span>
               <span
                  className="ml-auto text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                  style={{ color: theme.primary }}
               >
                  P{team.championshipPosition} · {team.points} PTS
               </span>
            </div>
         </div>

         {/* ─── Stat Cards ─── */}
         <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="telemetry-card p-4 text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
               <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
               <p className="stat-value text-amber-400 font-mono">P{team.championshipPosition}</p>
               <p className="stat-label mt-1 text-[10px] font-mono uppercase tracking-widest text-f1-silver/50">Championship</p>
            </div>
            <div className="telemetry-card p-4 text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
               <Medal className="w-5 h-5 text-f1-red mx-auto mb-1.5" />
               <p className="stat-value text-f1-red-light font-mono">{team.points}</p>
               <p className="stat-label mt-1 text-[10px] font-mono uppercase tracking-widest text-f1-silver/50">Points</p>
            </div>
            <div className="telemetry-card p-4 text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
               <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
               <p className="stat-value text-emerald-400 font-mono">{team.wins}</p>
               <p className="stat-label mt-1 text-[10px] font-mono uppercase tracking-widest text-f1-silver/50">Wins</p>
            </div>
         </div>

         {/* ─── Driver Lineup ─── */}
         <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2 shrink-0">
               <Shield className="w-4 h-4 text-f1-silver/50" />
               <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50">Driver Lineup</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
               {team.drivers.map((driver) => {
                  const driverImgUrl = driver.imageUrl ?? getDriverImage(theme, driver.firstName, driver.lastName);
                  return (
                     <Link key={driver.id} to={`/drivers/${driver.id}`} className="group outline-none">
                        <div className="telemetry-card overflow-hidden cursor-pointer group-hover:border-white/[0.12] transition-all duration-300">
                           {/* Mini hero gradient */}
                           <div
                              className="relative h-24 overflow-hidden"
                              style={{
                                 background: `linear-gradient(to right, ${theme.bgFrom}, ${theme.bgTo})`,
                              }}
                           >
                              <div
                                 className="absolute inset-0 opacity-20"
                                 style={{
                                    backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                                    backgroundSize: '14px 14px',
                                 }}
                              />
                              {driverImgUrl && (
                                 <div className="absolute right-0 bottom-0 h-24 w-20 overflow-hidden">
                                    <img
                                       src={driverImgUrl}
                                       alt={`${driver.firstName} ${driver.lastName}`}
                                       className="absolute top-0 left-0 w-full object-cover object-top drop-shadow-xl select-none"
                                       style={{
                                          height: '200%',
                                          transform: 'scale(1.25)',
                                          transformOrigin: 'top center',
                                       }}
                                       onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                 </div>
                              )}
                              <div className="absolute left-4 bottom-3">
                                 <p className="text-xl font-display font-black text-white">#{driver.number}</p>
                              </div>
                           </div>

                           <div className="p-3 flex items-center gap-3 border-t border-white/[0.06]">
                              <div>
                                 <p className="font-bold text-sm text-f1-white">{driver.firstName} {driver.lastName}</p>
                                 <p className="text-f1-silver/60 text-[10px] font-mono uppercase tracking-wider">{driver.nationality}</p>
                              </div>
                              <div className="ml-auto flex items-center gap-2">
                                 <div className="text-right">
                                    <p className="font-display font-black text-lg text-amber-400 leading-none">{driver.points}</p>
                                    <p className="text-[9px] font-mono text-f1-silver/40 uppercase tracking-widest mt-0.5">PTS</p>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-f1-silver/30 group-hover:text-f1-white group-hover:translate-x-0.5 transition-all" />
                              </div>
                           </div>
                        </div>
                     </Link>
                  );
               })}
            </div>
         </div>
      </div>
   );
};

export default ConstructorDetailPage;