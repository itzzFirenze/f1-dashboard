import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
   LayoutDashboard, Users, Trophy, Calendar, Map, BarChart3,
   Menu, X, Flag
} from 'lucide-react';

const navItems = [
   { path: '/', label: 'Dashboard', icon: LayoutDashboard, tag: 'HUB' },
   { path: '/drivers', label: 'Drivers', icon: Users, tag: 'DRV' },
   { path: '/constructors', label: 'Constructors', icon: Trophy, tag: 'CON' },
   { path: '/races', label: 'Race Schedule', icon: Calendar, tag: 'CAL' },
   { path: '/circuits', label: 'Circuits', icon: Map, tag: 'MAP' },
   { path: '/statistics', label: 'Statistics', icon: BarChart3, tag: 'STA' },
];

const Navbar: React.FC = () => {
   const [mobileOpen, setMobileOpen] = useState(false);
   const location = useLocation();

   return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-f1-carbon/90 backdrop-blur-xl border-b border-white/[0.06]">
         <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
               {/* Logo */}
               <Link to="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-f1-red rounded-xl flex items-center justify-center relative
                            group-hover:shadow-lg group-hover:shadow-f1-red/30 transition-all border border-white/[0.08]">
                     <Flag className="w-5 h-5 text-white" />
                     <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/20 rounded-b-xl" />
                  </div>
                  <div className="flex items-baseline gap-1">
                     <span className="font-display font-black text-lg tracking-tight text-f1-white uppercase">F1</span>
                     <span className="font-mono text-f1-silver/60 text-xs uppercase tracking-[0.2em]">Telemetry</span>
                  </div>
               </Link>

               {/* Desktop Navigation */}
               <div className="hidden md:flex items-center gap-1">
                  {navItems.map(({ path, label, icon: Icon, tag }) => {
                     const active = location.pathname === path;
                     return (
                        <Link
                           key={path}
                           to={path}
                           className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider
                  transition-all duration-200 ${active
                                 ? 'bg-f1-red/10 text-f1-red-light'
                                 : 'text-f1-silver/70 hover:text-f1-white hover:bg-white/[0.04]'
                              }`}
                        >
                           <Icon className="w-4 h-4" />
                           {label}
                           {active && (
                              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-f1-red rounded-full" />
                           )}
                        </Link>
                     );
                  })}
               </div>

               {/* Mobile menu button */}
               <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-lg text-f1-silver/70 hover:text-f1-white hover:bg-white/[0.04] transition-colors"
               >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
               </button>
            </div>
         </div>

         {/* Mobile Navigation */}
         {mobileOpen && (
            <div className="md:hidden bg-f1-carbon/95 backdrop-blur-xl border-b border-white/[0.06] animate-slide-up dot-grid">
               <div className="px-4 py-3 space-y-1 relative z-10">
                  {navItems.map(({ path, label, icon: Icon, tag }) => {
                     const active = location.pathname === path;
                     return (
                        <Link
                           key={path}
                           to={path}
                           onClick={() => setMobileOpen(false)}
                           className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border-l-2
                  transition-all ${active
                                 ? 'bg-f1-red/10 text-f1-red-light border-f1-red'
                                 : 'text-f1-silver/80 hover:text-f1-white hover:bg-white/[0.04] border-transparent'
                              }`}
                        >
                           <Icon className="w-5 h-5" />
                           <span className="flex-1">{label}</span>
                           <span className="text-[9px] font-mono text-f1-silver/40 uppercase tracking-widest">{tag}</span>
                        </Link>
                     );
                  })}
               </div>
            </div>
         )}
      </nav>
   );
};

export default Navbar;