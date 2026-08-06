import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Hash, Globe, Calendar } from 'lucide-react';
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
      { label: 'Championship', value: `P${driver.championshipPosition}`, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { label: 'Points', value: driver.points, icon: Hash, color: 'text-f1-red-light', bg: 'bg-f1-red/10' },
      { label: 'Wins', value: driver.wins, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { label: 'Podiums', value: driver.podiums, icon: Medal, color: 'text-blue-400', bg: 'bg-blue-500/10' },
   ];

   return (
      <div className="h-full flex flex-col gap-3 animate-fade-in overflow-hidden">
         <Link to="/drivers" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Standings</span>
         </Link>

         {/* Driver Hero Card */}
         <div className="glass-card overflow-hidden shrink-0">
            {/* Two-tone gradient hero background */}
            <div
               className="relative overflow-hidden h-[210px]"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 40%, ${theme.bgTo} 100%)`,
                  minHeight: '150px',
               }}
            >
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

               <div className="relative flex items-end h-full px-6 pt-4 pb-0">
                  {/* Driver info */}
                  <div className="pb-4 z-10 pr-[180px] sm:pr-[220px]">
                     <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.bgTo }}>
                        #{driver.number} · {driver.constructorName}
                     </p>
                     <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white drop-shadow-lg">
                        {driver.firstName}
                        <br />
                        <span className="text-3xl sm:text-4xl">{driver.lastName.toUpperCase()}</span>
                     </h1>
                     <div className="flex items-center gap-3 mt-2 text-white/60 text-sm">
                        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{driver.nationality}</span>
                        {driver.dateOfBirth && (
                           <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(driver.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Driver image: flush right, cropped from top */}
                  <div className="absolute right-0 bottom-0 top-0 w-[190px] sm:w-[230px] z-10">
                     {/* Big driver number sitting behind the image */}
                     <span
                        className="absolute inset-0 flex items-center justify-start font-display font-black leading-none select-none pointer-events-none"
                        style={{
                           fontSize: '9rem',
                           color: `${theme.bgTo}60`,
                           zIndex: 0,
                           transform: 'translateX(-90px)',
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
                                 transform: 'scale(1.1)',
                                 transformOrigin: 'top center',
                              }}
                              onError={() => setImgError(true)}
                           />
                        ) : (
                           <div
                              className="absolute inset-0 rounded-t-2xl flex items-end justify-center pb-4"
                              style={{ backgroundColor: `${theme.bgTo}22` }}
                           >
                              <span className="text-6xl font-display font-black text-white/20">{driver.code}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Meta bar */}
            <div className="px-6 py-2 flex items-center gap-4 border-t border-white/5">
               <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.primary }}
               />
               <span className="text-f1-silver text-sm">{driver.constructorName}</span>
               <span className="ml-auto text-2xl font-display font-black text-f1-light-gray/20">{driver.code}</span>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
               <div key={label} className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                     <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                     </div>
                  </div>
                  <p className={`stat-value ${color}`}>{value}</p>
                  <p className="stat-label mt-1">{label}</p>
               </div>
            ))}
         </div>

         {/* Team Info */}
         {driver.constructorId && (
            <Link to={`/constructors/${driver.constructorId}`} className="block shrink-0">
               <div className="glass-card p-4 group cursor-pointer hover:border-amber-500/30">
                  <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-2">Team</h3>
                  <div className="flex items-center gap-4">
                     <div
                        className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
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
                     <div>
                        <p className="text-lg font-bold group-hover:text-f1-red-light transition-colors">{driver.constructorName}</p>
                     </div>
                  </div>
               </div>
            </Link>
         )}
      </div>
   );
};

export default DriverDetailPage;