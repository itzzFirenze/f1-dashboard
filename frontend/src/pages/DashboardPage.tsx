import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
   Trophy, Flag, Users, Calendar, ChevronRight, TrendingUp,
   Activity, Compass, Shield, ArrowUpRight, Medal, Bell
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import CountdownTimer from '../components/ui/CountdownTimer';
import WeatherCard from '../components/ui/WeatherCard';
import NotifyMeModal from '../components/ui/NotifyMeModal';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import PageHeroTitle from '@/components/ui/PageHeroTitle';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import type { DashboardData, RaceResult } from '../types';

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
               <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06] shrink-0 hidden xs:inline-block">
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

interface FitTextProps {
   text: string;
   maxPx: number;
   minPx: number;
   className?: string;
}

const FitText: React.FC<FitTextProps> = ({ text, maxPx, minPx, className }) => {
   const ref = React.useRef<HTMLSpanElement>(null);
   const [fontSize, setFontSize] = useState(maxPx);

   React.useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;

      const fit = () => {
         let size = maxPx;
         el.style.fontSize = `${size}px`;
         while (el.scrollWidth > el.clientWidth && size > minPx) {
            size -= 1;
            el.style.fontSize = `${size}px`;
         }
         setFontSize(size);
      };

      fit();

      const ro = new ResizeObserver(fit);
      ro.observe(el);
      return () => ro.disconnect();
   }, [text, maxPx, minPx]);

   return (
      <span
         ref={ref}
         className={className}
         style={{ fontSize: `${fontSize}px`, whiteSpace: 'nowrap', display: 'block', width: '100%' }}
      >
         {text}
      </span>
   );
};

/* ─── Podium driver portrait card — F1 social-media style ─── */
interface PodiumCardProps {
   result: RaceResult;
   position: 1 | 2 | 3;
   elevated?: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ result, position, elevated }) => {
   const [imgErr, setImgErr] = useState(false);
   const theme = resolveTheme(result.constructorName);
   const imgUrl = theme ? getDriverImage(theme, result.driverFirstName, result.driverLastName) : null;
   const initials = `${result.driverFirstName[0]}${result.driverLastName[0]}`;

   const imgHeight = elevated ? 260 : 210;

   return (
      <div className={`podium-card flex-1 overflow-hidden ${elevated ? 'mt-0' : 'mt-8'}`}>
         {/* Image + overlays */}
         <div className="relative w-full" style={{ height: imgHeight }}>
            {/* Team-coloured gradient background, top → bottom */}
            <div
               className="absolute inset-0 z-0"
               style={{
                  background: `linear-gradient(180deg, ${result.constructorColor}CC 0%, ${result.constructorColor}CC 50%, #0d0d16 100%)`,
               }}
            />

            {/* Giant position number — top-left, white, sits BEHIND the driver image */}
            <div className="absolute top-1 left-1 sm:top-2 sm:left-3 z-[5] pointer-events-none select-none">
               <span
                  className={`leading-none ${elevated ? 'text-[4.75rem] sm:text-[7.5rem]' : 'text-[3.75rem] sm:text-[6.25rem]'}`}
                  style={{
                     fontFamily: "'Unbounded', sans-serif",
                     fontWeight: 900,
                     letterSpacing: '-0.02em',
                     lineHeight: 1,
                     color: '#FFFFFF'
                  }}
               >
                  {position}
               </span>
            </div>

            {/* Driver image — above the number, shifted right */}
            {imgUrl && !imgErr ? (
               <img
                  src={imgUrl}
                  alt={`${result.driverFirstName} ${result.driverLastName}`}
                  className="absolute inset-y-0 right-0 h-full w-[85%] object-cover object-[center_18%] sm:object-top z-10"
                  onError={() => setImgErr(true)}
               />
            ) : (
               <div
                  className="absolute inset-0 flex items-center justify-center font-display font-black text-5xl z-10"
                  style={{ color: `${result.constructorColor}80` }}
               >
                  {initials}
               </div>
            )}

            {/* Faint ambient glow at bottom, above the image */}
            <div
               className="absolute bottom-0 inset-x-0 h-1/2 pointer-events-none z-20"
               style={{
                  background: `linear-gradient(to top, ${result.constructorColor}28 0%, transparent 100%)`,
               }}
            />

            {/* Points badge — bottom right */}
            <div className="absolute bottom-2.5 right-2.5 flex flex-col items-end z-30">
               <span className="font-display font-black text-xl sm:text-2xl text-white leading-none">
                  {result.points}
               </span>
               <span className="text-[9px] font-mono text-white/60 uppercase tracking-widest">PTS</span>
            </div>
         </div>

         {/* Driver name strip — team colour background, centered, bigger name */}
         {/* Driver name strip — team colour background, centered, bigger name */}
         <div
            className="px-3 py-2.5 flex flex-col items-center text-center"
            style={{ backgroundColor: result.constructorColor }}
         >
            <FitText
               text={result.driverLastName}
               maxPx={elevated ? 20 : 18}
               minPx={11}
               className="font-display font-black text-white text-center uppercase tracking-wide leading-tight"
            />
            <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest truncate w-full mt-0.5">
               {result.constructorName}
            </span>
         </div>
      </div>
   );
};

/* ─── Grid row (P4–P10) — F1 broadcast style ─── */
const DriverGridRow: React.FC<{ result: RaceResult; index: number }> = ({ result, index }) => {
   const theme = resolveTheme(result.constructorName);
   return (
      <div
         className="grid-row"
         style={{ animationDelay: `${index * 25}ms`, animationFillMode: 'both' }}
      >
         {/* Position pill */}
         <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#E10600' }}
         >
            <span className="font-display font-black text-xs text-white">{result.position}</span>
         </div>

         {/* Team colour bar */}
         <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: result.constructorColor }}
         />

         {/* Driver name */}
         <div className="flex-1 min-w-0">
            <span className="text-xs sm:text-sm font-display font-black text-f1-white uppercase tracking-wide truncate block">
               {result.driverFirstName} {result.driverLastName}
            </span>
         </div>

         {/* Constructor name — desktop only, now shares flex space instead of a fixed 80px cap */}
         <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            {theme?.teamLogoUrl && (
               <img
                  src={theme.teamLogoUrl}
                  alt={result.constructorName}
                  className="h-4 w-auto object-contain opacity-80 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
               />
            )}
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-f1-silver/60 truncate text-right">
               {result.constructorName}
            </span>
         </div>

         {/* Team logo — mobile only, sits right before points */}
         {theme?.teamLogoUrl && (
            <img
               src={theme.teamLogoUrl}
               alt={result.constructorName}
               className="sm:hidden h-4 w-auto object-contain opacity-80 shrink-0"
               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
         )}

         {/* Points */}
         <div className="flex flex-col items-end shrink-0 ml-2">
            <span className="font-display font-black text-base leading-none" style={{ color: '#FBBF24' }}>
               {result.points > 0 ? result.points : '—'}
            </span>
            {result.points > 0 && (
               <span className="text-[9px] font-mono text-f1-silver/40 uppercase tracking-widest">PTS</span>
            )}
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
            <div className="">
               {/* Cinematic Next Race Banner */}
               <Link
                  to={`/races/${data.nextRaceId}`}
                  className="lg:col-span-2 group block outline-none"
               >
                  <div className="telemetry-card h-full p-6 sm:p-8 flex flex-col justify-between border border-f1-red/20 group-hover:border-f1-red/40 transition-all duration-300 relative overflow-hidden">
                     {/* Background circuit ambient glow */}
                     <div className="absolute -right-16 -top-16 w-64 h-64 bg-f1-red/10 rounded-full blur-3xl pointer-events-none group-hover:bg-f1-red/20 transition-all" />

                     {/* Top banner tag */}
                     <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full bg-f1-red animate-ping" />
                           <span className="text-xs font-mono font-bold text-f1-red-light tracking-[0.2em] uppercase">
                              Upcoming: {data.nextSessionName || 'Grand Prix Weekend'}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <button
                              type="button"
                              onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 setShowNotifyModal(true);
                              }}
                              className="flex items-center gap-1.5 text-xs font-mono font-bold text-f1-white bg-f1-red hover:bg-f1-red-dark transition-all px-3 py-1 rounded-lg border border-f1-red/60 shadow-[0_0_12px_rgba(225,6,0,0.35)] hover:shadow-[0_0_18px_rgba(225,6,0,0.6)] cursor-pointer"
                           >
                              <Bell className="w-3.5 h-3.5" />
                              <span>NOTIFY ME</span>
                           </button>
                           <div className="flex items-center gap-1 text-xs font-mono text-f1-silver/70 group-hover:text-f1-white transition-colors bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                              <span>TELEMETRY DECK</span>
                              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                           </div>
                        </div>
                     </div>

                     {/* Race Name & Circuit Info */}
                     <div className="my-3 relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-display font-black text-f1-white tracking-tight uppercase group-hover:text-f1-red-light transition-colors">
                           {data.nextRaceName}
                        </h2>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1.5">
                           <p className="text-f1-silver/90 text-sm sm:text-base font-mono flex items-center gap-2">
                              <Compass className="w-4 h-4 text-f1-red" />
                              <span>{data.nextRaceCircuit}</span>
                              <span className="text-f1-silver/40">|</span>
                              <span className="text-f1-white font-semibold">{data.nextRaceCountry}</span>
                           </p>

                           <CountdownTimer
                              targetDate={
                                 data.nextSessionTime
                                    ? `${data.nextSessionDate}T${data.nextSessionTime}Z`
                                    : data.nextSessionDate || ''
                              }
                           />
                        </div>
                     </div>
                  </div>
               </Link>

               {/* Atmospheric Weather Card */}
               {data.nextRaceWeather && (
                  <div className="h-full">
                     <WeatherCard weather={data.nextRaceWeather} />
                  </div>
               )}
            </div>
         )}

         {/* ─── Last Race Results: Podium & Full Grid ─── */}
         {lastRaceDetail && lastRaceDetail.results && lastRaceDetail.results.length > 0 && (() => {
            // Show only positions 1–10 directly (lapped/non-scoring drivers are always P11+)
            const top10 = [...lastRaceDetail.results]
               .sort((a, b) => a.position - b.position)
               .filter(r => r.position >= 1 && r.position <= 10);

            const p1 = top10.find(r => r.position === 1);
            const p2 = top10.find(r => r.position === 2);
            const p3 = top10.find(r => r.position === 3);
            const rest = top10.filter(r => r.position > 3);

            return (
               <div className="space-y-3">
                  {/* Section header */}
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                           <Medal className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50">Last Race Results</p>
                           <h3 className="text-base sm:text-lg font-display font-black text-f1-white leading-tight">
                              {lastRaceDetail.name}
                           </h3>
                        </div>
                     </div>
                     <Link
                        to={`/races/${lastRaceDetail.id}`}
                        className="flex items-center gap-1 text-xs font-mono text-f1-silver/60 hover:text-f1-red-light transition-colors bg-white/[0.04] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg border border-white/[0.06] group"
                     >
                        <span>Full Results</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                     </Link>
                  </div>

                  {/* Podium — P2 | P1 (elevated) | P3 */}
                  <div className="flex items-end gap-2 sm:gap-3">
                     {p2 && <PodiumCard result={p2} position={2} />}
                     {p1 && <PodiumCard result={p1} position={1} elevated />}
                     {p3 && <PodiumCard result={p3} position={3} />}
                  </div>

                  {/* P4–P10 grid — always visible */}
                  {rest.length > 0 && (
                     <div className="space-y-1.5 pt-1">
                        {rest.map((result, idx) => (
                           <DriverGridRow key={result.id} result={result} index={idx} />
                        ))}
                     </div>
                  )}
               </div>
            );
         })()}

         {/* ─── Championship Leaders: Telemetry Standings ─── */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Driver Championship Leader */}
            {data.driverChampionshipLeader && (
               <Link
                  to={`/drivers/${data.driverChampionshipLeader.id}`}
                  className="group block outline-none"
               >
                  <div className="diagonal-card p-6 relative group cursor-pointer transition-all duration-300">
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

                     <div className="flex items-center gap-4 sm:gap-5">
                        {/* Driver Portrait Frame */}
                        <div
                           className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center font-display font-black text-2xl text-white shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform"
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
                           <h3 className="text-xl sm:text-2xl font-black font-display text-f1-white truncate mt-0.5">
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
                           <div className="text-3xl sm:text-4xl font-display font-black text-amber-400 leading-none">
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
                  <div className="diagonal-card p-6 relative group cursor-pointer transition-all duration-300">
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

                     <div className="flex items-center gap-4 sm:gap-5">
                        {/* Constructor Logo Frame */}
                        <div
                           className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.08] shadow-lg relative group-hover:scale-105 transition-transform bg-f1-abyss/80 p-2.5"
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
                           <h3 className="text-xl sm:text-2xl font-black font-display text-f1-white truncate mt-0.5">
                              {data.constructorChampionshipLeader.name}
                           </h3>
                           <p className="text-xs sm:text-sm font-mono text-f1-silver/60 truncate mt-0.5">
                              {data.constructorChampionshipLeader.nationality} Heritage
                           </p>
                        </div>

                        {/* Points Scoreboard */}
                        <div className="text-right shrink-0 pl-2">
                           <div className="text-3xl sm:text-4xl font-display font-black text-amber-400 leading-none">
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