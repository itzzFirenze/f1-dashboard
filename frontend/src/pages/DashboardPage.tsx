import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
   Trophy, Flag, Users, Calendar, ChevronRight,
   Activity, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import NotifyMeModal from '../components/ui/NotifyMeModal';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import { resolveTheme } from '../config/teamThemes';
import NextRaceCard from '../components/ui/NextRaceCard';
import LastRaceResults from '../components/ui/LastRaceResults';
import type { DashboardData } from '../types';

/** Gauge stat card with animated circular telemetry arc */
interface StatGaugeCardProps {
   title: string;
   value: number | string;
   unit: string;
   icon: React.ElementType;
   percent: number;
   colorHex: string;
   badgeText?: string;
   to?: string;
}

const StatGaugeCard: React.FC<StatGaugeCardProps> = ({
   title,
   value,
   unit,
   icon: Icon,
   percent,
   colorHex,
   badgeText,
   to,
}) => {
   const radius = 36;
   const circumference = 2 * Math.PI * radius;
   const strokeDashoffset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

   const card = (
      <div className={`telemetry-card p-3.5 sm:p-5 group flex flex-col justify-between relative overflow-hidden h-full ${to ? 'cursor-pointer' : ''}`}>
         {/* Subtle top indicator bar */}
         <div
            className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
            style={{ background: `linear-gradient(90deg, transparent, ${colorHex}, transparent)` }}
         />

         {/* Header */}
         <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
               <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-white/[0.06] transition-transform group-hover:scale-105 shrink-0"
                  style={{ backgroundColor: `${colorHex}15` }}
               >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: colorHex }} />
               </div>
               <span className="text-[10px] sm:text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase truncate">
                  {title}
               </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
               {badgeText && (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06] shrink-0">
                     {badgeText}
                  </span>
               )}
               {to && (
                  <ChevronRight
                     className="w-3.5 h-3.5 text-f1-silver/40 group-hover:translate-x-0.5 transition-all group-hover:[color:var(--icon-color)]"
                     style={{ '--icon-color': colorHex } as React.CSSProperties}
                  />
               )}
            </div>
         </div>

         {/* Center Gauge & Value */}
         <div className="flex items-center justify-between mt-1 sm:mt-2 gap-2">
            <div className="min-w-0">
               <div className="text-2xl sm:text-4xl font-black font-display tracking-tight text-f1-white flex items-baseline gap-1">
                  <span className="truncate">{value}</span>
               </div>
               <p className="text-[10px] sm:text-[11px] font-mono text-f1-silver/50 tracking-widest uppercase mt-0.5 truncate">
                  {unit}
               </p>
            </div>

            {/* Circular HUD Dial */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                  {/* Outer track */}
                  <circle
                     cx="44"
                     cy="44"
                     r={radius}
                     className="gauge-track"
                  />
                  {/* Animated value track */}
                  <circle
                     cx="44"
                     cy="44"
                     r={radius}
                     className="gauge-fill"
                     style={{
                        stroke: colorHex,
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        filter: `drop-shadow(0 0 6px ${colorHex}80)`,
                     }}
                  />
               </svg>
               <span className="absolute font-mono text-[9px] sm:text-[11px] font-bold text-f1-white/90">
                  {Math.round(percent)}%
               </span>
            </div>
         </div>
      </div>
   );

   if (to) {
      return (
         <Link to={to} className="group block outline-none h-full">
            {card}
         </Link>
      );
   }

   return card;
};

const DashboardPage: React.FC = () => {
   const [logoError, setLogoError] = useState(false);
   const [showNotifyModal, setShowNotifyModal] = useState(false);

   const { data, isLoading } = useQuery<DashboardData>({
      queryKey: ['dashboard'],
      queryFn: dashboardService.getData,
      refetchInterval: (query) => (query.state.data?.sessionLive ? 30000 : 2 * 60 * 1000),
   });

   const { data: lastRaceDetail } = useQuery({
      queryKey: ['lastRaceResults'],
      queryFn: () => dashboardService.getLastRaceResults(),
      staleTime: 60 * 1000,
      refetchInterval: () => (data?.sessionLive ? 30000 : 5 * 60 * 1000),
   });

   if (isLoading) return <PageSkeleton />;
   if (!data) return null;

   const constructorTheme = data.constructorChampionshipLeader
      ? resolveTheme(data.constructorChampionshipLeader.name)
      : null;

   const seasonProgress = data.totalRaces > 0
      ? Math.round((data.racesCompleted / data.totalRaces) * 100)
      : 0;

   return (
      <div className="space-y-7 animate-fade-in">
         {/* ─── Hero Section: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
            {/* Scanline texture */}
            <div className="scanline-overlay" />

            {/* Futuristic ambient glows */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
               <div className="space-y-2">
                  <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                     <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                        FIA FORMULA 1 WORLD CHAMPIONSHIP
                     </span>
                  </div>

                  <PageHeroTitle titlePrefix={data.currentSeason} titleAccent="SEASON" />

                  <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                     Pit wall telemetry, live session status & real-time championship engineering intelligence.
                  </p>
               </div>
            </div>
         </div>

         {/* ─── Telemetry HUD Stats Grid ─── */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatGaugeCard
               title="Rounds Completed"
               value={data.racesCompleted}
               unit="Grand Prix Cleared"
               icon={Flag}
               percent={seasonProgress}
               colorHex="#10b981"
               to="/races?status=COMPLETED"
            />
            <StatGaugeCard
               title="Rounds Remaining"
               value={data.racesRemaining}
               unit="Grand Prix Ahead"
               icon={Calendar}
               percent={100 - seasonProgress}
               colorHex="#E10600"
               to="/races?status=UPCOMING"
            />
            {/* Driver Championship Leader */}
            {data.driverChampionshipLeader && (
               <Link
                  to={`/drivers/${data.driverChampionshipLeader.id}`}
                  className="group block outline-none col-span-2 sm:col-span-1 lg:col-span-1"
               >
                  <div className="telemetry-card p-3.5 sm:p-5 h-full relative group cursor-pointer transition-all duration-300 flex flex-col justify-between">
                     {/* Subtle top indicator bar */}
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
                        style={{
                           background: `linear-gradient(90deg, transparent, ${data.driverChampionshipLeader.constructorColor || '#f59e0b'}, transparent)`,
                        }}
                     />

                     {/* Header */}
                     <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                           <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-white/[0.06] transition-transform group-hover:scale-105 shrink-0"
                              style={{ backgroundColor: `${data.driverChampionshipLeader.constructorColor || '#f59e0b'}15` }}
                           >
                              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 " style={{
                                 color: data.driverChampionshipLeader.constructorColor || '#f59e0b'
                              }} />
                           </div>
                           <span className="text-[10px] sm:text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase truncate">
                              Driver Leaderboard
                           </span>
                        </div>
                        <ChevronRight
                           className="w-3.5 h-3.5 text-f1-silver/40 group-hover:[color:var(--team-color)] group-hover:translate-x-0.5 transition-all shrink-0"
                           style={{
                              '--team-color': data.driverChampionshipLeader.constructorColor || '#f59e0b',
                           } as React.CSSProperties}
                        />
                     </div>

                     {/* Center Content & Points */}
                     <div className="flex items-center justify-between mt-1 sm:mt-2 gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                           {/* Driver Acronym Frame */}
                           <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center font-mono font-bold text-xs sm:text-sm text-white shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `${data.driverChampionshipLeader.constructorColor}30` }}
                           >
                              <span className="font-mono font-bold tracking-wider text-white">
                                 {data.driverChampionshipLeader.code}
                              </span>
                           </div>

                           {/* Driver Meta */}
                           <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black font-display text-f1-white truncate">
                                 {data.driverChampionshipLeader.firstName} {data.driverChampionshipLeader.lastName}
                              </h3>
                              <p
                                 className="text-[10px] sm:text-xs font-mono font-medium truncate mt-0.5"
                                 style={{ color: data.driverChampionshipLeader.constructorColor }}
                              >
                                 {data.driverChampionshipLeader.constructorName}
                              </p>
                           </div>
                        </div>

                        {/* Points Scoreboard */}
                        <div className="text-right shrink-0 pl-1">
                           <div className="text-xl sm:text-2xl lg:text-3xl font-display font-black leading-none"
                              style={{
                                 color: data.driverChampionshipLeader.constructorColor || '#f59e0b'
                              }}>
                              {data.driverChampionshipLeader.points}
                           </div>
                           <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-f1-silver/50 uppercase block mt-1">
                              PTS
                           </span>
                        </div>
                     </div>
                  </div>
               </Link>
            )}

            {/* Constructor Championship Leader */}
            {data.constructorChampionshipLeader && (
               <Link
                  to={`/constructors/${data.constructorChampionshipLeader.id}`}
                  className="group block outline-none col-span-2 sm:col-span-1 lg:col-span-1"
               >
                  <div className="telemetry-card p-3.5 sm:p-5 h-full relative group cursor-pointer transition-all duration-300 flex flex-col justify-between">
                     {/* Subtle top indicator bar */}
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-75 transition-opacity group-hover:opacity-100"
                        style={{
                           background: `linear-gradient(90deg, transparent, ${data.constructorChampionshipLeader.color || '#f59e0b'}, transparent)`,
                        }}
                     />

                     {/* Header */}
                     <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                           <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-white/[0.06] transition-transform group-hover:scale-105 shrink-0"
                              style={{ backgroundColor: `${data.constructorChampionshipLeader.color || '#f59e0b'}15` }}
                           >
                              <Shield
                                 className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                                 style={{
                                    color: data.constructorChampionshipLeader.color || '#f59e0b'
                                 }}
                              />
                           </div>
                           <span className="text-[10px] sm:text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase truncate">
                              Constructor Leaderboard
                           </span>
                        </div>
                        <ChevronRight
                           className="w-3.5 h-3.5 text-f1-silver/40 group-hover:[color:var(--team-color)] group-hover:translate-x-0.5 transition-all shrink-0"
                           style={{
                              '--team-color': data.constructorChampionshipLeader.color || '#f59e0b',
                           } as React.CSSProperties}
                        />
                     </div>

                     {/* Center Content & Points */}
                     <div className="flex items-center justify-between mt-1 sm:mt-2 gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                           {/* Constructor Logo Frame */}
                           <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform bg-f1-abyss/80 p-2"
                           >
                              {constructorTheme?.teamLogoUrl && !logoError ? (
                                 <img
                                    src={constructorTheme.teamLogoUrl}
                                    alt={data.constructorChampionshipLeader.name}
                                    className="w-full h-full object-contain"
                                    onError={() => setLogoError(true)}
                                 />
                              ) : (
                                 <Trophy
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                                    style={{
                                       color:
                                          data.constructorChampionshipLeader.color || '#f59e0b',
                                    }}
                                 />
                              )}
                           </div>

                           {/* Constructor Meta */}
                           <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-black font-display text-f1-white truncate">
                                 {data.constructorChampionshipLeader.name}
                              </h3>
                              <p className="text-[10px] sm:text-xs font-mono text-f1-silver/60 truncate mt-0.5">
                                 {data.constructorChampionshipLeader.nationality} Heritage
                              </p>
                           </div>
                        </div>

                        {/* Points Scoreboard */}
                        <div className="text-right shrink-0 pl-1">
                           <div className="text-xl sm:text-2xl lg:text-3xl font-display font-black leading-none"
                              style={{
                                 color: data.constructorChampionshipLeader.color || '#f59e0b'
                              }}>
                              {data.constructorChampionshipLeader.points}
                           </div>
                           <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-f1-silver/50 uppercase block mt-1">
                              PTS
                           </span>
                        </div>
                     </div>
                  </div>
               </Link>
            )}
         </div>

         {/* ─── Next Grand Prix Telemetry Strip ─── */}
         {data.nextRaceName && (
            <NextRaceCard
               nextRaceId={data.nextRaceId}
               nextRaceName={data.nextRaceName}
               nextRaceCircuit={data.nextRaceCircuit}
               nextRaceCountry={data.nextRaceCountry}
               nextSessionName={data.nextSessionName}
               nextSessionDate={data.nextSessionDate}
               nextSessionTime={data.nextSessionTime}
               sessionLive={data.sessionLive}
               nextRaceWeather={data.nextRaceWeather}
               onNotifyClick={() => setShowNotifyModal(true)}
            />
         )}

         {/* ─── Recent Race / Sprint Results: Podium & Full Grid ─── */}
         {lastRaceDetail && lastRaceDetail.results && lastRaceDetail.results.length > 0 && (
            <LastRaceResults
               raceId={lastRaceDetail.id}
               raceName={lastRaceDetail.name}
               sessionType={lastRaceDetail.sessionType}
               sessionDate={lastRaceDetail.sessionDate}
               results={lastRaceDetail.results}
               sprintResults={lastRaceDetail.sprintResults}
               raceResults={lastRaceDetail.raceResults}
            />
         )}


         {/* ─── Fast Telemetry Navigation Quick Links ─── */}
         <div className="pt-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-3 px-1">
               Engineering Command Shortcuts
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
               {[
                  { to: '/drivers', label: 'Driver Standings', icon: Users, accent: '#38bdf8', tag: 'DRV' },
                  { to: '/constructors', label: 'Constructor Table', icon: Shield, accent: '#f59e0b', tag: 'CON' },
                  { to: '/races', label: 'Grand Prix Calendar', icon: Calendar, accent: '#10b981', tag: 'CAL' },
                  { to: '/momentum', label: 'Momentum Analytics', icon: Activity, accent: '#a855f7', tag: 'MOM' },
               ].map(({ to, label, icon: Icon, accent, tag }) => (
                  <Link key={to} to={to} className="group outline-none h-full flex">
                     <div className="pill-button justify-between py-3 sm:py-3.5 px-3 sm:px-4 group-hover:border-white/[0.12] transition-all w-full h-full min-h-[62px] flex items-center">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                           <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.04]"
                              style={{ backgroundColor: `${accent}15` }}
                           >
                              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: accent }} />
                           </div>
                           <div className="min-w-0 flex-1">
                              <span className="text-xs font-mono font-semibold text-f1-white group-hover:text-f1-red-light transition-colors block truncate">
                                 {label}
                              </span>
                              <span className="text-[9px] font-mono text-f1-silver/40 uppercase block truncate">
                                 TELEMETRY /{tag}
                              </span>
                           </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-f1-silver/30 group-hover:text-f1-white group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block ml-1" />
                     </div>
                  </Link>
               ))}
            </div>
         </div>

         {data.nextRaceId && data.nextRaceName && (
            <NotifyMeModal
               isOpen={showNotifyModal}
               onClose={() => setShowNotifyModal(false)}
               raceId={data.nextRaceId}
               raceName={data.nextRaceName}
               circuitName={data.nextRaceCircuit}
               country={data.nextRaceCountry}
               sessionName={data.nextSessionName}
            />
         )}
      </div>
   );
};

export default DashboardPage;