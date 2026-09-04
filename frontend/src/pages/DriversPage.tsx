import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, User } from 'lucide-react';
import { driverService } from '../services/driverService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import SearchInput from '../components/ui/SearchInput';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import EmptyState from '../components/ui/EmptyState';
import type { Driver } from '../types';

const PositionBadge: React.FC<{ position: number }> = ({ position }) => {
   const tier =
      position === 1
         ? { bg: 'bg-amber-400/10', border: 'border-amber-400/25', text: 'text-amber-400' }
         : position === 2
            ? { bg: 'bg-gray-300/10', border: 'border-gray-300/25', text: 'text-gray-300' }
            : position === 3
               ? { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400' }
               : { bg: 'bg-white/[0.04]', border: 'border-white/[0.06]', text: 'text-f1-silver/70' };

   return (
      <div
         className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-black text-sm border ${tier.bg} ${tier.border} ${tier.text}`}
      >
         {position}
      </div>
   );
};

const DriversPage: React.FC = () => {
   const [search, setSearch] = useState('');
   const debouncedSearch = useDebouncedValue(search, search ? 300 : 0);

   const { data: drivers = [], isLoading } = useQuery<Driver[]>({
      queryKey: ['drivers', debouncedSearch, 2026],
      queryFn: () => driverService.getAll(debouncedSearch || undefined, 2026),
   });

   if (isLoading) return <PageSkeleton />;

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Header: Mission Control HUD banner ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            <div className="scanline-overlay" />
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <User className="w-3 h-3 text-f1-red-light" />
                     <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        Driver Championship
                     </span>
                  </div>

                  <PageHeroTitle titlePrefix="Driver" titleAccent="Standings" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     2026 FIA Formula One World Championship — full grid telemetry, ranked by points.
                  </p>
               </div>

               {/* Live Grid Radar Pill */}
               <div className="flex items-center gap-4 bg-f1-abyss/80 border border-white/[0.08] rounded-2xl p-4 sm:p-5 backdrop-blur-xl shrink-0">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-f1-red/10 border border-f1-red/20 shrink-0">
                     <Users className="w-6 h-6 text-f1-red" />
                  </div>
                  <div>
                     <div className="text-[10px] font-mono text-f1-silver/60 uppercase tracking-widest">
                        Grid Size
                     </div>
                     <div className="font-display font-bold text-base text-f1-white mt-0.5">
                        {drivers.length} Drivers
                     </div>
                     <div className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span>●</span> Live Standings
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* ─── Search Strip ─── */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 px-1">
               Engineering Search
            </div>
            <div className="w-full sm:w-72">
               <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search drivers..."
               />
            </div>
         </div>

         {drivers.length === 0 ? (
            <EmptyState title="No drivers found" message="Try adjusting your search." />
         ) : (
            <div className="telemetry-card overflow-hidden relative">
               <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
               <div className="w-full">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b border-white/[0.06]">
                           <th className="text-left text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest px-2.5 sm:px-4 py-3 w-10 sm:w-12">Pos</th>
                           <th className="text-left text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest px-2 sm:px-4 py-3">Driver</th>
                           <th className="text-left text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest px-4 py-3 hidden sm:table-cell">Team</th>
                           <th className="text-left text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest px-4 py-3 hidden md:table-cell">Nationality</th>
                           <th className="text-right text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest px-2.5 sm:px-4 py-3 w-16 sm:w-auto">Points</th>
                           <th className="text-right text-[10px] font-mono text-f1-silver/50 uppercase tracking-widest px-4 py-3 hidden sm:table-cell">Wins</th>
                        </tr>
                     </thead>
                     <tbody>
                        {drivers.map((driver, i) => (
                           <tr
                              key={driver.id}
                              className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group relative"
                              style={{ animationDelay: `${i * 30}ms` }}
                           >
                              <td className="px-2.5 sm:px-4 py-3 sm:py-4">
                                 <PositionBadge position={driver.championshipPosition} />
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4">
                                 <Link
                                    to={`/drivers/${driver.id}`}
                                    className="flex items-center gap-2 sm:gap-3 min-w-0"
                                 >
                                    <div
                                       className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-mono font-bold text-[11px] sm:text-xs text-white border border-white/[0.08] shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform"
                                       style={{ backgroundColor: `${driver.constructorColor}30` }}
                                    >
                                       {driver.code}
                                       <div
                                          className="absolute bottom-0 inset-x-0 h-0.5"
                                          style={{ backgroundColor: driver.constructorColor }}
                                       />
                                    </div>
                                    <div className="min-w-0">
                                       <p className="font-display font-bold text-xs sm:text-sm md:text-base text-f1-white group-hover:text-f1-red-light transition-colors truncate">
                                          {driver.firstName} <span className="font-black">{driver.lastName}</span>
                                       </p>
                                       <p className="text-[10px] sm:text-xs font-mono text-f1-silver/60 sm:hidden truncate">{driver.constructorName}</p>
                                    </div>
                                 </Link>
                              </td>
                              <td className="px-4 py-4 hidden sm:table-cell">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: driver.constructorColor }} />
                                    <span className="text-f1-silver/80 text-sm font-mono truncate">{driver.constructorName}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-4 text-f1-silver/70 text-sm font-mono hidden md:table-cell">
                                 {driver.nationality}
                              </td>
                              <td className="px-2.5 sm:px-4 py-3 sm:py-4 text-right shrink-0">
                                 <span className="font-display font-black text-base sm:text-lg text-amber-400">{driver.points}</span>
                              </td>
                              <td className="px-4 py-4 text-right hidden sm:table-cell">
                                 {driver.wins > 0 && (
                                    <div className="flex items-center justify-end gap-1">
                                       <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                       <span className="font-mono font-semibold text-amber-400">{driver.wins}</span>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}
      </div>
   );
};

export default DriversPage;
