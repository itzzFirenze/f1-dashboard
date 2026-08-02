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

   useEffect(() => {
      if (id) {
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

   const stats = [
      { label: 'Championship', value: `P${driver.championshipPosition}`, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { label: 'Points', value: driver.points, icon: Hash, color: 'text-f1-red-light', bg: 'bg-f1-red/10' },
      { label: 'Wins', value: driver.wins, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { label: 'Podiums', value: driver.podiums, icon: Medal, color: 'text-blue-400', bg: 'bg-blue-500/10' },
   ];

   return (
      <div className="space-y-6 animate-fade-in">
         <Link to="/drivers" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Standings</span>
         </Link>

         {/* Driver Hero Card */}
         <div className="glass-card overflow-hidden">
            {/* Two-tone gradient hero background */}
            <div
               className="relative overflow-hidden"
               style={{
                  background: `linear-gradient(to right, ${theme.bgFrom} 0%, ${theme.bgFrom} 40%, ${theme.bgTo} 100%)`,
                  minHeight: '220px',
               }}
            >
               {/* Dot-grid texture overlay (matches reference image) */}
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

               <div className="relative flex items-end justify-between h-full px-6 pt-6 pb-0">
                  {/* Driver info */}
                  <div className="pb-6 z-10">
                     <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: theme.bgTo }}>
                        #{driver.number} · {driver.constructorName}
                     </p>
                     <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white drop-shadow-lg">
                        {driver.firstName}
                        <br />
                        <span className="text-4xl sm:text-5xl">{driver.lastName.toUpperCase()}</span>
                     </h1>
                     <div className="flex items-center gap-3 mt-3 text-white/60 text-sm">
                        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{driver.nationality}</span>
                        {driver.dateOfBirth && (
                           <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(driver.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Driver image: cropped to top half, zoomed, number shown behind */}
                  <div className="relative h-52 sm:h-64" style={{ width: '260px' }}>
                     {/* Big driver number sitting behind the image — own layer, not clipped */}
                     <span
                        className="absolute inset-0 flex items-center justify-start font-display font-black leading-none select-none pointer-events-none"
                        style={{
                           fontSize: '12rem',
                           color: `${theme.bgTo}60`,
                           zIndex: 0,
                           transform: 'translateX(-130px)', // push further left, can go negative freely now
                        }}
                     >
                        {driver.number}
                     </span>

                     {/* Image gets its own clipped box, layered on top */}
                     <div className="absolute inset-0 overflow-hidden z-10" style={{ width: '220px', marginLeft: 'auto' }}>
                        {driverImgUrl ? (
                           <img
                              src={driverImgUrl}
                              alt={`${driver.firstName} ${driver.lastName}`}
                              className="absolute top-0 left-0 w-full object-cover object-top select-none drop-shadow-2xl"
                              style={{
                                 height: '200%',
                                 transform: 'scale(1.4)',
                                 transformOrigin: 'top center',
                              }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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
            <div className="px-6 py-3 flex items-center gap-4 border-t border-white/5">
               <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.primary }}
               />
               <span className="text-f1-silver text-sm">{driver.constructorName}</span>
               <span className="ml-auto text-3xl font-display font-black text-f1-light-gray/20">#{driver.code}</span>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
               <div key={label} className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                     <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                     </div>
                  </div>
                  <p className={`stat-value ${color}`}>{value}</p>
                  <p className="stat-label mt-1">{label}</p>
               </div>
            ))}
         </div>

         {/* Team Info */}
         {driver.constructorId && (
            <Link to={`/constructors/${driver.constructorId}`}>
               <div className="glass-card p-6 group cursor-pointer">
                  <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-3">Team</h3>
                  <div className="flex items-center gap-4">
                     <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: driver.constructorColor }}
                     >
                        <Trophy className="w-5 h-5 text-white" />
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