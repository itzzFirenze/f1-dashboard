import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Medal } from 'lucide-react';
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
         <Link to="/constructors" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Standings</span>
         </Link>

         {/* Team Hero Card */}
         <div className="glass-card overflow-hidden shrink-0">
            {/* Two-tone gradient hero */}
            <div
               className="relative overflow-hidden"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 35%, ${theme.bgTo} 100%)`,
                  minHeight: '130px',
               }}
            >
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
                     <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white drop-shadow-lg">
                        {team.name}
                     </h1>
                     <p className="text-white/50 text-sm mt-1">{team.nationality}</p>
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
            <div className="px-6 py-2 flex items-center gap-4 border-t border-white/5">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
               <span className="text-f1-silver text-sm">{team.nationality}</span>
               <span
                  className="ml-auto text-xs font-bold uppercase tracking-widest"
                  style={{ color: theme.primary }}
               >
                  P{team.championshipPosition} · {team.points} PTS
               </span>
            </div>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="glass-card p-4 text-center">
               <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
               <p className="stat-value text-amber-400">P{team.championshipPosition}</p>
               <p className="stat-label mt-1">Championship</p>
            </div>
            <div className="glass-card p-4 text-center">
               <Medal className="w-5 h-5 text-f1-red mx-auto mb-1.5" />
               <p className="stat-value text-f1-red-light">{team.points}</p>
               <p className="stat-label mt-1">Points</p>
            </div>
            <div className="glass-card p-4 text-center">
               <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
               <p className="stat-value text-emerald-400">{team.wins}</p>
               <p className="stat-label mt-1">Wins</p>
            </div>
         </div>

         {/* Driver Lineup */}
         <div className="flex-1 min-h-0 flex flex-col">
            <h2 className="text-lg font-bold mb-2 shrink-0">Driver Lineup</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
               {team.drivers.map((driver) => {
                  const driverImgUrl = driver.imageUrl ?? getDriverImage(theme, driver.firstName, driver.lastName);
                  return (
                     <Link key={driver.id} to={`/drivers/${driver.id}`}>
                        <div className="glass-card overflow-hidden group cursor-pointer hover:border-white/10">
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

                           <div className="p-3 flex items-center gap-3">
                              <div>
                                 <p className="font-bold text-sm">{driver.firstName} {driver.lastName}</p>
                                 <p className="text-f1-silver text-xs">{driver.nationality}</p>
                              </div>
                              <div className="ml-auto text-right">
                                 <p className="font-display font-bold text-lg">{driver.points}</p>
                                 <p className="text-xs text-f1-silver">PTS</p>
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