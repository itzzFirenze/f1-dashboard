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
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-7 sm:p-9 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-f1-red/[0.04] to-transparent transform skew-x-12 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <Calendar className="w-3.5 h-3.5 text-f1-red-light" />
                     <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        RACE CONTROL CALENDAR
                     </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-f1-white uppercase">
                     2026 <span className="gradient-text">CALENDAR</span>
                  </h1>

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     Full grand prix schedule with live status feed & round-by-round telemetry.
                  </p>
               </div>

               {/* Filter + Search Console */}
               <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center relative z-10">
                  <div className="flex gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                     {(['', 'COMPLETED', 'UPCOMING'] as const).map((s) => (
                        <button
                           key={s}
                           onClick={() => setStatusFilter(s)}
                           className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all ${statusFilter === s
                                 ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                                 : 'text-f1-silver/60 hover:text-f1-white'
                              }`}
                        >
                           {s || 'All'}
                        </button>
                     ))}
                  </div>
                  <div className="w-full sm:w-56">
                     <SearchInput value={search} onChange={setSearch} placeholder="Search races..." />
                  </div>
               </div>
            </div>
         </div>

         {races.length === 0 ? (
            <EmptyState title="No races found" message="Try adjusting your search or filter." />
         ) : (
            <div className="grid gap-4">
               {races.map((race, i) => {
                  const isCompleted = race.status === 'COMPLETED';
                  const accent = race.sprintWeekend ? '#a855f7' : isCompleted ? '#10b981' : '#E10600';

                  return (
                     <Link key={race.id} to={`/races/${race.id}`} className="group block outline-none">
                        <div
                           className="telemetry-card p-4 sm:p-5 flex items-center gap-4 relative overflow-hidden animate-slide-up"
                           style={{ animationDelay: `${i * 30}ms` }}
                        >
                           {/* Top indicator bar */}
                           <div
                              className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
                              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                           />

                           {/* Round Badge */}
                           <div
                              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-white/[0.06]"
                              style={{ backgroundColor: `${accent}15` }}
                           >
                              <span className="text-[9px] font-mono text-f1-silver/50 uppercase tracking-widest">Round</span>
                              <span className="font-display font-black text-xl leading-none text-f1-white">{race.round}</span>
                           </div>

                           {/* Race Info */}
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-tight truncate text-f1-white group-hover:text-f1-red-light transition-colors">
                                    {race.name}
                                 </h3>
                                 {race.sprintWeekend && (
                                    <span className="inline-flex items-center text-[10px] font-mono font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 rounded-full">
                                       <Zap className="w-3 h-3 mr-1" />Sprint
                                    </span>
                                 )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-f1-silver/60">
                                 <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" style={{ color: accent }} />
                                    {race.circuitName}
                                 </span>
                                 <span className="hidden sm:inline text-f1-silver/30">|</span>
                                 <span className="hidden sm:inline uppercase tracking-wider">{race.country}</span>
                              </div>
                           </div>

                           {/* Date + Status */}
                           <div className="text-right flex-shrink-0 flex items-center gap-3 sm:gap-4">
                              <div className="hidden sm:block">
                                 <p className="text-[10px] font-mono text-f1-silver/40 uppercase tracking-widest mb-0.5">Date</p>
                                 <p className="text-sm font-mono font-semibold text-f1-white">{formatDate(race.raceDate)}</p>
                              </div>
                              <span
                                 className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${isCompleted
                                       ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                       : 'bg-f1-red/10 text-f1-red-light border-f1-red/25'
                                    }`}
                              >
                                 {isCompleted ? (
                                    <><Flag className="w-3 h-3" />Completed</>
                                 ) : (
                                    <><Radio className="w-3 h-3 animate-pulse" />Upcoming</>
                                 )}
                              </span>
                              <ChevronRight className="w-4 h-4 text-f1-silver/40 group-hover:text-f1-white group-hover:translate-x-0.5 transition-all" />
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