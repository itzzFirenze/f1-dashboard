import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Hash, Globe, Calendar, Radio, ChevronRight } from 'lucide-react';
import { driverService } from '../services/driverService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { resolveTheme, getDriverImage } from '../config/teamThemes';
import type { DriverDetail } from '../types';

const DriverDetailPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const [driver, setDriver] = useState<DriverDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [imgError, setImgError] = useState(false);
   const [logoError, setLogoError] = useState(false);

   useEffect(() => {
      if (id) {
         setImgError(false);
         setLogoError(false);
         driverService.getById(Number(id))
            .then(setDriver)
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [id]);

   if (loading) return <PageSkeleton />;
   if (!driver) return null;

   const theme = resolveTheme(driver.constructorName);
   const driverImgUrl = driver.imageUrl ?? getDriverImage(theme, driver.firstName, driver.lastName);
   const showDriverImg = driverImgUrl && !imgError;

   const stats = [
      { label: 'Championship', value: `P${driver.championshipPosition}`, icon: Trophy, color: '#fbbf24', accent: 'via-amber-400' },
      { label: 'Points', value: driver.points, icon: Hash, color: '#fb6f6f', accent: 'via-f1-red' },
      { label: 'Wins', value: driver.wins, icon: Trophy, color: '#34d399', accent: 'via-emerald-400' },
      { label: 'Podiums', value: driver.podiums, icon: Medal, color: '#60a5fa', accent: 'via-blue-400' },
   ];

   return (
      <div className="h-full flex flex-col gap-3 animate-fade-in overflow-hidden">
         <Link to="/drivers" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors shrink-0 group w-fit">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-widest">Back to Standings</span>
         </Link>

         {/* ─── Driver Hero HUD Card ─── */}
         <div className="telemetry-card overflow-hidden shrink-0">
            {/* Two-tone gradient hero background */}
            <div
               className="relative overflow-hidden h-[210px] dot-grid"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 40%, ${theme.bgTo} 100%)`,
                  minHeight: '150px',
               }}
            >
               <div className="scanline-overlay" />
               {/* Dot-grid texture overlay */}
               <div
                  className="absolute inset-0 opacity-20"
                  style={{
                     backgroundImage: `radial-gradient(circle, ${theme.bgTo} 1px, transparent 1px)`,
                     backgroundSize: '18px 18px',
                  }}
               />
               {/* Right-side radial glow */}
               <div
                  className="absolute inset-0"
                  style={{
                     background: `radial-gradient(ellipse at 80% 50%, ${theme.bgTo}55 0%, transparent 65%)`,
                  }}
               />

               {/* Status pill */}
               <div className="absolute top-4 left-6 z-10 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/25 border border-white/15 backdrop-blur-md">
                  <Radio className="w-3 h-3 text-white/80" />
                  <span className="text-white/80 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                     Driver Telemetry
                  </span>
               </div>

               <div className="relative flex items-end h-full px-4 sm:px-6 pt-4 pb-0">
                  {/* Driver info */}
                  <div className="pb-4 z-10 pr-[135px] sm:pr-[220px]">
                     <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.bgTo }}>
                        #{driver.number} · {driver.constructorName}
                     </p>
                     <h1 className="text-xl sm:text-3xl font-display font-black tracking-tight text-white drop-shadow-lg leading-tight">
                        {driver.firstName}
                        <br />
                        <span className="text-2xl sm:text-4xl">{driver.lastName.toUpperCase()}</span>
                     </h1>
                     <div className="flex items-center gap-2.5 sm:gap-3 mt-1.5 sm:mt-2 text-white/60 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5" />{driver.nationality}</span>
                        {driver.dateOfBirth && (
                           <span className="flex items-center gap-1">
                              <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              {new Date(driver.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Driver image: flush right, cropped from top (3/4 scale on mobile) */}
                  <div className="absolute right-0 bottom-0 top-0 w-[140px] sm:w-[230px] z-10">
                     {/* Big driver number sitting behind the image */}
                     <span
                        className="absolute inset-0 flex items-center justify-start font-display font-black leading-none select-none pointer-events-none text-6xl sm:text-[9rem] -translate-x-12 sm:-translate-x-[90px]"
                        style={{
                           color: `${theme.bgTo}60`,
                           zIndex: 0,
                        }}
                     >
                        {driver.number}
                     </span>

                     {/* Image box */}
                     <div className="absolute inset-0 overflow-hidden z-10">
                        {showDriverImg ? (
                           <img
                              src={driverImgUrl!}
                              alt={`${driver.firstName} ${driver.lastName}`}
                              className="w-full h-full object-cover object-top select-none drop-shadow-2xl"
                              style={{
                                 transform: 'scale(1.05)',
                                 transformOrigin: 'top center',
                              }}
                              onError={() => setImgError(true)}
                           />
                        ) : (
                           <div
                              className="absolute inset-0 rounded-t-2xl flex items-end justify-center pb-4"
                              style={{ backgroundColor: `${theme.bgTo}22` }}
                           >
                              <span className="text-4xl sm:text-6xl font-display font-black text-white/20">{driver.code}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Meta bar */}
            <div className="px-6 py-2.5 flex items-center gap-4 border-t border-white/[0.06]">
               <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
               />
               <span className="text-f1-silver text-xs font-mono uppercase tracking-wider">{driver.constructorName}</span>
               <span className="ml-auto text-2xl font-display font-black text-f1-light-gray/20 tracking-wider">{driver.code}</span>
            </div>
         </div>

         {/* ─── Stats Grid (telemetry cards) ─── */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {stats.map(({ label, value, icon: Icon, color, accent }) => (
               <div key={label} className="telemetry-card p-4 relative overflow-hidden">
                  <div className={`absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent ${accent} to-transparent`} />
                  <div className="flex items-center gap-3 mb-2">
                     <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.06]"
                        style={{ backgroundColor: `${color}15` }}
                     >
                        <Icon className="w-4 h-4" style={{ color }} />
                     </div>
                  </div>
                  <p className="stat-value font-mono" style={{ color }}>{value}</p>
                  <p className="stat-label mt-1 text-[10px] font-mono uppercase tracking-widest text-f1-silver/50">{label}</p>
               </div>
            ))}
         </div>

         {/* ─── Team Info ─── */}
         {driver.constructorId && (
            <Link to={`/constructors/${driver.constructorId}`} className="block shrink-0 group outline-none">
               <div className="telemetry-card p-4 cursor-pointer group-hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-3">Team</h3>
                  <div className="flex items-center gap-4">
                     <div
                        className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.06]"
                        style={{ backgroundColor: driver.constructorColor }}
                     >
                        {theme.teamLogoUrl && !logoError ? (
                           <img
                              src={theme.teamLogoUrl}
                              alt={driver.constructorName}
                              className="w-full h-full object-contain p-1.5"
                              onError={() => setLogoError(true)}
                           />
                        ) : (
                           <Trophy className="w-4 h-4 text-white" />
                        )}
                     </div>
                     <div className="flex-1">
                        <p className="text-lg font-bold text-f1-white group-hover:text-f1-red-light transition-colors">{driver.constructorName}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-f1-silver/30 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
               </div>
            </Link>
         )}
      </div>
   );
};

export default DriverDetailPage;