import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
   Trophy, Flag, Users, Calendar, ChevronRight, TrendingUp,
   Activity, Compass, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import NotifyMeModal from '../components/ui/NotifyMeModal';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
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
   glowClass: string;
   badgeText?: string;
}

const StatGaugeCard: React.FC<StatGaugeCardProps> = ({
   title,
   value,
   unit,
   icon: Icon,
   percent,
   colorHex,
   glowClass,
   badgeText
}) => {
   const radius = 36;
   const circumference = 2 * Math.PI * radius;
   const strokeDashoffset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

   return (
      <div className="telemetry-card p-3.5 sm:p-5 group flex flex-col justify-between relative overflow-hidden">
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
            {badgeText && (
               <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06] shrink-0">
                  {badgeText}
               </span>
            )}
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
};

const DashboardPage: React.FC = () => {
   const [driverImgError, setDriverImgError] = useState(false);
   const [logoError, setLogoError] = useState(false);
   const [showNotifyModal, setShowNotifyModal] = useState(false);

   const { data, isLoading } = useQuery<DashboardData>({
      queryKey: ['dashboard'],
      queryFn: dashboardService.getData,
   });

   const { data: lastRaceDetail } = useQuery({
      queryKey: ['lastRaceResults'],
      queryFn: () => dashboardService.getLastRaceResults(),
      staleTime: 5 * 60 * 1000,
   });

   if (isLoading) return <PageSkeleton />;
   if (!data) return null;

   const driverTheme = data.driverChampionshipLeader
      ? resolveTheme(data.driverChampionshipLeader.constructorName)
      : null;
   const driverImgUrl = driverTheme && data.driverChampionshipLeader
      ? getDriverImage(
         driverTheme,
         data.driverChampionshipLeader.firstName,
         data.driverChampionshipLeader.lastName
      )
      : null;

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
               glowClass="emerald"
               badgeText="PASSED"
            />
            <StatGaugeCard
               title="Rounds Remaining"
               value={data.racesRemaining}
               unit="Grand Prix Ahead"
               icon={Calendar}
               percent={100 - seasonProgress}
               colorHex="#E10600"
               glowClass="red"
               badgeText="PENDING"
            />
            <StatGaugeCard
               title="Total Calendar"
               value={data.totalRaces}
               unit="Championship Stages"
               icon={Trophy}
               percent={100}
               colorHex="#f59e0b"
               glowClass="amber"
               badgeText="OFFICIAL"
            />
            <StatGaugeCard
               title="Season Trajectory"
               value={`${seasonProgress}%`}
               unit="Campaign Elapsed"
               icon={TrendingUp}
               percent={seasonProgress}
               colorHex="#38bdf8"
               glowClass="sky"
               badgeText="LIVE RATIO"
            />
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
               nextRaceWeather={data.nextRaceWeather}
               onNotifyClick={() => setShowNotifyModal(true)}
            />
         )}

         {/* ─── Last Race Results: Podium & Full Grid ─── */}
         {lastRaceDetail && lastRaceDetail.results && lastRaceDetail.results.length > 0 && (
            <LastRaceResults
               raceId={lastRaceDetail.id}
               raceName={lastRaceDetail.name}
               results={lastRaceDetail.results}
            />
         )}

         {/* ─── Championship Leaders: Telemetry Standings ─── */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Driver Championship Leader */}
            {data.driverChampionshipLeader && (
               <Link
                  to={`/drivers/${data.driverChampionshipLeader.id}`}
                  className="group block outline-none"
               >
                  <div className="diagonal-card p-4 sm:p-6 relative group cursor-pointer transition-all duration-300">
                     {/* Dynamic Team Color Accent Line */}
                     <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                        style={{ backgroundColor: data.driverChampionshipLeader.constructorColor || '#E10600' }}
                     />

                     <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                           <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                              <Trophy className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                              Driver Leaderboard #01
                           </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-f1-silver/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                     </div>

                     <div className="flex items-center gap-3 sm:gap-5">
                        {/* Driver Portrait Frame */}
                        <div
                           className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center font-display font-black text-2xl text-white shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform"
                           style={{ backgroundColor: `${data.driverChampionshipLeader.constructorColor}30` }}
                        >
                           {driverImgUrl && !driverImgError ? (
                              <img
                                 src={driverImgUrl}
                                 alt={`${data.driverChampionshipLeader.firstName} ${data.driverChampionshipLeader.lastName}`}
                                 className="w-full h-full object-cover object-top"
                                 onError={() => setDriverImgError(true)}
                              />
                           ) : (
                              <span className="font-mono">{data.driverChampionshipLeader.code}</span>
                           )}
                           <div
                              className="absolute bottom-0 inset-x-0 h-1"
                              style={{ backgroundColor: data.driverChampionshipLeader.constructorColor }}
                           />
                        </div>

                        {/* Driver Meta */}
                        <div className="flex-1 min-w-0">
                           <div className="text-xs font-mono font-semibold text-f1-silver/60 uppercase tracking-wider">
                              P1 Standings Leader
                           </div>
                           <h3 className="text-lg sm:text-2xl font-black font-display text-f1-white truncate mt-0.5">
                              {data.driverChampionshipLeader.firstName} {data.driverChampionshipLeader.lastName}
                           </h3>
                           <p
                              className="text-xs sm:text-sm font-mono font-medium truncate mt-0.5"
                              style={{ color: data.driverChampionshipLeader.constructorColor }}
                           >
                              {data.driverChampionshipLeader.constructorName}
                           </p>
                        </div>

                        {/* Points Scoreboard */}
                        <div className="text-right shrink-0 pl-2">
                           <div className="text-2xl sm:text-4xl font-display font-black text-amber-400 leading-none">
                              {data.driverChampionshipLeader.points}
                           </div>
                           <span className="text-[10px] font-mono tracking-widest text-f1-silver/50 uppercase block mt-1">
                              POINTS
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
                  className="group block outline-none"
               >
                  <div className="diagonal-card p-4 sm:p-6 relative group cursor-pointer transition-all duration-300">
                     {/* Dynamic Team Color Accent Line */}
                     <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                        style={{ backgroundColor: data.constructorChampionshipLeader.color || '#E10600' }}
                     />

                     <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                           <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                              <Shield className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                              Constructor Leaderboard #01
                           </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-f1-silver/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                     </div>

                     <div className="flex items-center gap-3 sm:gap-5">
                        {/* Constructor Logo Frame */}
                        <div
                           className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform bg-f1-abyss/80 p-2.5"
                        >
                           {constructorTheme?.teamLogoUrl && !logoError ? (
                              <img
                                 src={constructorTheme.teamLogoUrl}
                                 alt={data.constructorChampionshipLeader.name}
                                 className="w-full h-full object-contain"
                                 onError={() => setLogoError(true)}
                              />
                           ) : (
                              <Trophy className="w-8 h-8 text-amber-400" />
                           )}
                           <div
                              className="absolute bottom-0 inset-x-0 h-1"
                              style={{ backgroundColor: data.constructorChampionshipLeader.color }}
                           />
                        </div>

                        {/* Constructor Meta */}
                        <div className="flex-1 min-w-0">
                           <div className="text-xs font-mono font-semibold text-f1-silver/60 uppercase tracking-wider">
                              World Champions Leading
                           </div>
                           <h3 className="text-lg sm:text-2xl font-black font-display text-f1-white truncate mt-0.5">
                              {data.constructorChampionshipLeader.name}
                           </h3>
                           <p className="text-xs sm:text-sm font-mono text-f1-silver/60 truncate mt-0.5">
                              {data.constructorChampionshipLeader.nationality} Heritage
                           </p>
                        </div>

                        {/* Points Scoreboard */}
                        <div className="text-right shrink-0 pl-2">
                           <div className="text-2xl sm:text-4xl font-display font-black text-amber-400 leading-none">
                              {data.constructorChampionshipLeader.points}
                           </div>
                           <span className="text-[10px] font-mono tracking-widest text-f1-silver/50 uppercase block mt-1">
                              POINTS
                           </span>
                        </div>
                     </div>
                  </div>
               </Link>
            )}
         </div>

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