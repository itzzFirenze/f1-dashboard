import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
   Home,
   ArrowLeft,
   Calendar,
   Users,
   Radio,
   Activity
} from 'lucide-react';

const NotFoundPage: React.FC = () => {
   const location = useLocation();
   const navigate = useNavigate();

   const quickLinks = [
      { label: 'Dashboard', path: '/', icon: Home, desc: 'Live HUD & championship overview' },
      { label: 'Race Schedule', path: '/races', icon: Calendar, desc: 'Upcoming Grand Prix weekends' },
      { label: 'Drivers Standings', path: '/drivers', icon: Users, desc: 'Current season driver table' },
   ];

   return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
         {/* Main Card */}
         <div className="telemetry-card max-w-2xl w-full p-6 sm:p-10 relative overflow-hidden dot-grid text-center">
            {/* Top glowing accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-f1-red to-transparent" />
            <div className="scanline-overlay pointer-events-none" />

            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
               {/* Telemetry Warning Badge */}
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/30 mb-6">
                  <span className="w-2 h-2 rounded-full bg-f1-red animate-ping" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-f1-red-light">
                     Telemetry Error · Track Limits Exceeded
                  </span>
               </div>

               {/* Giant 404 Display */}
               <div className="relative my-2 select-none">
                  <span className="font-display font-black text-7xl sm:text-9xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/10 drop-shadow-[0_0_35px_rgba(225,6,0,0.3)]">
                     404
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[12px] font-mono uppercase tracking-[0.35em] text-f1-silver/40 font-semibold bg-f1-carbon/80 px-3 py-1 rounded border border-white/[0.06] backdrop-blur-sm">
                        Sector Not Found
                     </span>
                  </div>
               </div>

               {/* Heading and explanation */}
               <h1 className="text-xl sm:text-2xl font-display font-black uppercase text-f1-white tracking-wide mt-4 mb-2">
                  Car Out of Bounds
               </h1>
               <p className="text-f1-silver/80 text-sm sm:text-base max-w-lg mx-auto font-sans leading-relaxed mb-6">
                  The requested track sector <code className="px-2 py-0.5 rounded bg-white/[0.06] text-amber-300 font-mono text-xs border border-white/[0.08] break-all">{location.pathname}</code> does not exist on the race calendar or has been retired to the paddock.
               </p>

               {/* Race Control Radio Box */}
               <div className="bg-f1-abyss/80 border border-white/[0.08] rounded-xl p-3.5 mb-8 text-left max-w-lg mx-auto">
                  <div className="flex items-center justify-between text-[10px] font-mono text-f1-silver/60 uppercase tracking-widest pb-2 mb-2 border-b border-white/[0.06]">
                     <span className="flex items-center gap-1.5 text-amber-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Team Radio · Pit Wall
                     </span>
                     <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-f1-red" />
                        FLAG: DOUBLE YELLOW
                     </span>
                  </div>
                  <p className="text-xs font-mono text-white/90 italic">
                     &ldquo;Box box, box box. We lost telemetry on that line. Rejoining standard route now.&rdquo;
                  </p>
               </div>

               {/* Primary Action Buttons */}
               <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                  <Link
                     to="/"
                     className="px-5 py-2.5 rounded-xl bg-f1-red hover:bg-f1-red-dark text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-f1-red/25 hover:shadow-f1-red/40 transition-all"
                  >
                     <Home className="w-4 h-4" />
                     Return to Pit Lane
                  </Link>

                  <button
                     onClick={() => navigate(-1)}
                     className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-f1-silver hover:text-white border border-white/[0.08] font-mono font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                  >
                     <ArrowLeft className="w-4 h-4" />
                     Previous Sector
                  </button>
               </div>

               {/* Quick Telemetry Links */}
               <div className="pt-6 border-t border-white/[0.06]">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50 mb-3">
                     Available Navigation Routes
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                     {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                           <Link
                              key={link.path}
                              to={link.path}
                              className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.12] transition-all group"
                           >
                              <div className="flex items-center gap-2 text-xs font-mono font-bold text-f1-white group-hover:text-f1-red-light transition-colors">
                                 <Icon className="w-3.5 h-3.5 text-f1-silver/60 group-hover:text-f1-red" />
                                 {link.label}
                              </div>
                              <p className="text-[10px] font-mono text-f1-silver/50 mt-1 truncate">
                                 {link.desc}
                              </p>
                           </Link>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default NotFoundPage;
