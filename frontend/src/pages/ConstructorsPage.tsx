import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trophy, ChevronRight, Shield, Gauge } from 'lucide-react';
import { constructorService } from '../services/constructorService';
import { useFavorites } from '../context/FavoritesContext';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { resolveTheme } from '../config/teamThemes';
import type { Constructor } from '../types';

const ConstructorsPage: React.FC = () => {
   const [constructors, setConstructors] = useState<Constructor[]>([]);
   const [loading, setLoading] = useState(true);
   const { toggleFavoriteTeam, isTeamFavorite } = useFavorites();

   useEffect(() => {
      constructorService.getAll()
         .then(setConstructors)
         .catch(console.error)
         .finally(() => setLoading(false));
   }, []);

   if (loading) return <PageSkeleton />;

   const leader = constructors[0];
   const maxPoints = leader?.points || 1;

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
                  <Shield className="w-3.5 h-3.5 text-f1-red-light" />
                  <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                     CONSTRUCTOR TELEMETRY
                  </span>
               </div>

               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-f1-white uppercase">
                  TEAM <span className="gradient-text">STANDINGS</span>
               </h1>

               <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  Constructor championship rankings & real-time points telemetry across the grid.
               </p>
            </div>
         </div>

         {/* ─── Standings List ─── */}
         <div className="grid gap-4">
            {constructors.map((team, i) => {
               const theme = resolveTheme(team.name);
               const logoSrc = team.logoUrl ?? theme.teamLogoUrl;
               const pointsPct = Math.round((team.points / maxPoints) * 100);
               const accent = team.color || '#E10600';

               return (
                  <Link key={team.id} to={`/constructors/${team.id}`} className="group block outline-none">
                     <div className="telemetry-card p-5 relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                        {/* Top indicator bar */}
                        <div
                           className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
                           style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                        />
                        {/* Left accent */}
                        <div
                           className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                           style={{ backgroundColor: accent }}
                        />

                        <div className="flex items-center gap-4 sm:gap-5 pl-2">
                           {/* Position Badge */}
                           <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-lg shrink-0 border ${i === 0 ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                    i === 1 ? 'bg-gray-300/10 text-gray-300 border-gray-300/20' :
                                       i === 2 ? 'bg-orange-600/10 text-orange-400 border-orange-600/20' :
                                          'bg-white/[0.04] text-f1-silver/70 border-white/[0.06]'
                                 }`}
                           >
                              P{team.championshipPosition}
                           </div>

                           {/* Team Logo Frame */}
                           <div
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform bg-f1-abyss/80 p-2"
                           >
                              <img
                                 src={logoSrc}
                                 alt={team.name}
                                 className="w-full h-full object-contain"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="absolute bottom-0 inset-x-0 h-1" style={{ backgroundColor: accent }} />
                           </div>

                           {/* Team Meta */}
                           <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-mono font-semibold text-f1-silver/50 uppercase tracking-[0.2em]">
                                 Constructor /{team.nationality?.slice(0, 3).toUpperCase()}
                              </div>
                              <h3 className="text-lg sm:text-xl font-black font-display text-f1-white truncate mt-0.5 group-hover:text-f1-red-light transition-colors">
                                 {team.name}
                              </h3>
                              {team.wins > 0 && (
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-mono font-semibold text-amber-400">{team.wins} WINS</span>
                                 </div>
                              )}
                           </div>

                           {/* Mini HUD points bar */}
                           <div className="hidden md:flex flex-col items-end gap-1.5 w-32 shrink-0">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest">
                                 <Gauge className="w-3 h-3" style={{ color: accent }} />
                                 <span>Pace Index</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                 <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pointsPct}%`, backgroundColor: accent, boxShadow: `0 0 8px ${accent}80` }}
                                 />
                              </div>
                           </div>

                           {/* Points Scoreboard */}
                           <div className="text-right shrink-0 pl-2">
                              <div className="text-2xl sm:text-3xl font-display font-black text-f1-white leading-none">
                                 {team.points}
                              </div>
                              <span className="text-[10px] font-mono tracking-widest text-f1-silver/50 uppercase block mt-1">
                                 POINTS
                              </span>
                           </div>

                           {/* Favorite + Arrow */}
                           <div className="flex items-center gap-1 shrink-0">
                              <button
                                 onClick={(e) => { e.preventDefault(); toggleFavoriteTeam(team.id); }}
                                 className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                              >
                                 <Star className={`w-4 h-4 ${isTeamFavorite(team.id) ? 'fill-amber-400 text-amber-400' : 'text-f1-silver/30'}`} />
                              </button>
                              <ChevronRight className="w-4 h-4 text-f1-silver/40 group-hover:text-f1-white group-hover:translate-x-0.5 transition-all" />
                           </div>
                        </div>
                     </div>
                  </Link>
               );
            })}
         </div>
      </div>
   );
};

export default ConstructorsPage;