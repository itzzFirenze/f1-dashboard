import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Zap, Flag, Radio } from 'lucide-react';
import { raceService } from '../services/raceService';
import SearchInput from '../components/ui/SearchInput';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Race } from '../types';

const RaceSchedulePage: React.FC = () => {
   const [races, setRaces] = useState<Race[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('');

   useEffect(() => {
      const timer = setTimeout(() => {
         raceService.getAll(2026, statusFilter || undefined, search || undefined)
            .then(setRaces)
            .catch(console.error)
            .finally(() => setLoading(false));
      }, search ? 300 : 0);
      return () => clearTimeout(timer);
   }, [search, statusFilter]);

   if (loading) return <PageSkeleton />;

   const formatDate = (date: string) =>
      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

   return (
      <div className="space-y-5 sm:space-y-7 animate-fade-in w-full max-w-full overflow-hidden">
         {/* ─── Hero Section: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-4 sm:p-8 shadow-2xl dot-grid w-full max-w-full">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6 min-w-0">
               <div className="space-y-1.5 sm:space-y-2 min-w-0">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <Calendar className="w-3 h-3 text-f1-red-light" />
                     <span className="text-f1-red-light text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        RACE CONTROL CALENDAR
                     </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase">
                     2026 <span className="gradient-text">CALENDAR</span>
                  </h1>

                  <p className="text-f1-silver text-xs sm:text-base max-w-xl font-medium leading-relaxed">
                     Full grand prix schedule with live status feed &amp; round-by-round telemetry.
                  </p>
               </div>

               {/* Filter + Search Console */}
               <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center relative z-10 w-full lg:w-auto min-w-0">
                  <div className="flex gap-1 sm:gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 min-w-0">
                     {(['', 'COMPLETED', 'UPCOMING'] as const).map((s) => (
                        <button
                           key={s}
                           onClick={() => setStatusFilter(s)}
                           className={`flex-1 sm:flex-initial px-2 sm:px-3.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider transition-all truncate text-center ${statusFilter === s
                              ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                              : 'text-f1-silver/60 hover:text-f1-white'
                              }`}
                        >
                           {s || 'All'}
                        </button>
                     ))}
                  </div>
                  <div className="w-full sm:w-56 min-w-0">
                     <SearchInput value={search} onChange={setSearch} placeholder="Search races..." />
                  </div>
               </div>
            </div>
         </div>

         {races.length === 0 ? (
            <EmptyState title="No races found" message="Try adjusting your search or filter." />
         ) : (
            <div className="grid gap-2.5 sm:gap-4 w-full max-w-full min-w-0">
               {races.map((race, i) => {
                  const isCompleted = race.status === 'COMPLETED';
                  const accent = race.sprintWeekend ? '#a855f7' : isCompleted ? '#10b981' : '#E10600';

                  return (
                     <Link key={race.id} to={`/races/${race.id}`} className="group block w-full max-w-full min-w-0 outline-none">
                        <div
                           className="telemetry-card w-full max-w-full min-w-0 p-2.5 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 relative overflow-hidden animate-slide-up"
                           style={{ animationDelay: `${i * 30}ms` }}
                        >
                           {/* Top indicator bar */}
                           <div
                              className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
                              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                           />

                           {/* Left side: Round Badge + Info */}
                           <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                              {/* Round Badge */}
                              <div
                                 className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex flex-col items-center justify-center shrink-0 border border-white/[0.06]"
                                 style={{ backgroundColor: `${accent}15` }}
                              >
                                 <span className="text-[7px] sm:text-[9px] font-mono text-f1-silver/50 uppercase tracking-widest leading-none">RND</span>
                                 <span className="font-display font-black text-sm sm:text-xl leading-none text-f1-white mt-0.5">{race.round}</span>
                              </div>

                              {/* Race Info */}
                              <div className="min-w-0 flex-1">
                                 <div className="flex items-center gap-1 sm:gap-2 flex-wrap min-w-0">
                                    <h3 className="font-display font-black text-xs sm:text-lg uppercase tracking-tight truncate text-f1-white group-hover:text-f1-red-light transition-colors">
                                       {race.name}
                                    </h3>
                                    {race.sprintWeekend && (
                                       <span className="inline-flex items-center text-[8px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/25 px-1 sm:px-2 py-0.5 rounded-full shrink-0">
                                          <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />Sprint
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-mono text-f1-silver/60 min-w-0">
                                    <span className="flex items-center gap-1 truncate min-w-0">
                                       <MapPin className="w-3 h-3 shrink-0" style={{ color: accent }} />
                                       <span className="truncate">{race.circuitName}</span>
                                    </span>
                                    <span className="hidden sm:inline text-f1-silver/30 shrink-0">|</span>
                                    <span className="hidden sm:inline uppercase tracking-wider shrink-0">{race.country}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Right side: Date + Status */}
                           <div className="text-right shrink-0 flex items-center gap-1.5 sm:gap-4">
                              <div className="hidden sm:block">
                                 <p className="text-[10px] font-mono text-f1-silver/40 uppercase tracking-widest mb-0.5">Date</p>
                                 <p className="text-sm font-mono font-semibold text-f1-white">{formatDate(race.raceDate)}</p>
                              </div>
                              <span
                                 className={`text-[8px] sm:text-[10px] font-mono font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border flex items-center gap-1 shrink-0 ${isCompleted
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-f1-red/10 text-f1-red-light border-f1-red/25'
                                    }`}
                              >
                                 {isCompleted ? (
                                    <><Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />Completed</>
                                 ) : (
                                    <><Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />Upcoming</>
                                 )}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-f1-silver/40 group-hover:text-f1-white group-hover:translate-x-0.5 transition-all shrink-0" />
                           </div>
                        </div>
                     </Link>
                  );
               })}
            </div>
         )}
      </div>
   );
};

export default RaceSchedulePage;