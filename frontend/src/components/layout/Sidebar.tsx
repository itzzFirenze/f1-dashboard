import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
   LayoutDashboard, Trophy, Calendar, Map,
   Menu, X, Flag, ChevronDown, ChevronRight, Activity, GitCompare, Tv, Sparkles,
   ChevronsLeft, ChevronsRight, Gauge
} from 'lucide-react';
import logoPng from '../../assets/pitwall-logo.png'

interface NavItem {
   path?: string;
   label: string;
   icon: React.ElementType;
   subItems?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
   { path: '/', label: 'Dashboard', icon: LayoutDashboard },
   { path: '/replay', label: 'Replay Center', icon: Tv },
   { path: '/telemetry/ghost', label: 'Telemetry Ghost', icon: Gauge },
   {
      label: 'Standings', icon: Trophy,
      subItems: [
         { path: '/drivers', label: 'Drivers' },
         { path: '/constructors', label: 'Constructors' },
         { path: '/timeline', label: 'Timeline' },
      ]
   },
   {
      label: 'Races', icon: Calendar,
      subItems: [
         { path: '/races', label: 'Schedule' },
         { path: '/weather', label: 'Weather Forecast' },
      ]
   },
   { path: '/circuits', label: 'Circuits', icon: Map },
   { path: '/trivia', label: 'Trivia Quiz', icon: Sparkles },
   {
      label: 'Analytics', icon: Activity,
      subItems: [
         { path: '/analytics/power-rankings', label: 'Power Rankings' },
         { path: '/momentum', label: 'Momentum Tracker' },
         { path: '/analytics/consistency', label: 'Consistency' },
         { path: '/records', label: 'Historical Records' },
         { path: '/statistics', label: 'Statistics' },
      ]
   },
   {
      label: 'Compare', icon: GitCompare,
      subItems: [
         { path: '/compare/drivers', label: 'Drivers' },
         { path: '/compare/teammates', label: 'Teammates' },
         { path: '/compare/constructors', label: 'Constructors' },
      ]
   },
];

interface SidebarProps {
   isCollapsed?: boolean;
   onToggleCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
   isCollapsed = false,
   onToggleCollapse
}) => {
   const [mobileOpen, setMobileOpen] = useState(false);
   const [collapsed, setCollapsed] = useState(isCollapsed);
   const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
   const [hoveredItem, setHoveredItem] = useState<string | null>(null);
   const location = useLocation();

   useEffect(() => {
      setCollapsed(isCollapsed);
   }, [isCollapsed]);

   const handleCollapseToggle = () => {
      const next = !collapsed;
      setCollapsed(next);
      onToggleCollapse?.(next);
      window.dispatchEvent(new CustomEvent('f1-sidebar-toggle', { detail: { collapsed: next } }));
   };

   // Auto-expand sections that contain the active route
   useEffect(() => {
      navItems.forEach(item => {
         if (item.subItems?.some(sub => location.pathname === sub.path)) {
            setOpenSections(prev => ({ ...prev, [item.label]: true }));
         }
      });
   }, [location.pathname]);

   const toggleSection = (label: string) => {
      if (collapsed) {
         handleCollapseToggle();
         setOpenSections(prev => ({ ...prev, [label]: true }));
         return;
      }
      setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
   };

   const isActive = (item: NavItem) => {
      if (item.path && location.pathname === item.path) return true;
      if (item.subItems) {
         return item.subItems.some(sub => location.pathname === sub.path);
      }
      return false;
   };

   const renderSidebarContent = (isMobile: boolean) => {
      const isExpanded = isMobile || !collapsed;

      return (
         <div className="flex flex-col h-full bg-f1-abyss/95 backdrop-blur-2xl border-r border-white/[0.05] relative select-none">
            {/* Top Logo and Collapse Switch */}
            <div className={`flex items-center ${isExpanded ? 'justify-between p-4' : 'justify-center py-4'} pb-2 transition-all`}>
               <Link
                  to="/"
                  className="flex items-center gap-3 group"
                  onClick={() => setMobileOpen(false)}
               >
                  <div className="relative w-12 h-12 bg-white/[0.07] hover:bg-white/[0.12] rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-[0_0_15px_rgba(225,6,0,0.2)] p-1 transition-all">
                     <img src={logoPng} alt="Pitwall Logo" className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                  </div>
                  {isExpanded && (
                     <div className="flex flex-col">
                        <div className="flex items-baseline">
                           <span className="font-display font-black text-xl tracking-tight text-f1-white">F1</span>
                           <span className="font-display font-medium text-f1-red-light text-xl ml-1">HUD</span>
                        </div>
                        <span className="text-[9px] font-mono tracking-[0.2em] text-f1-silver/50 uppercase -mt-0.5">
                           Telemetry Deck
                        </span>
                     </div>
                  )}
               </Link>
               {!isMobile && isExpanded && (
                  <button
                     onClick={handleCollapseToggle}
                     className="p-1.5 rounded-lg text-f1-silver/50 hover:text-f1-white hover:bg-white/[0.05] transition-all hidden md:flex"
                     title="Collapse navigation"
                  >
                     <ChevronsLeft className="w-4 h-4" />
                  </button>
               )}
            </div>

            {/* Collapse button for when collapsed */}
            {!isMobile && !isExpanded && (
               <div className="flex justify-center pb-2">
                  <button
                     onClick={handleCollapseToggle}
                     className="p-1.5 rounded-lg text-f1-silver/50 hover:text-f1-white hover:bg-white/[0.05] transition-all hidden md:flex"
                     title="Expand navigation"
                  >
                     <ChevronsRight className="w-4 h-4" />
                  </button>
               </div>
            )}

            {/* Carbon divider */}
            <div className="mx-3 carbon-divider" />

            {/* Navigation links */}
            <div className={`flex-1 overflow-y-auto px-2.5 pb-6 pt-3 space-y-1 ${isExpanded ? 'circuit-line' : ''}`}>
               {navItems.map((item, idx) => (
                  <div key={item.label} className="relative">
                     {item.subItems ? (
                        <div>
                           <button
                              onClick={() => toggleSection(item.label)}
                              onMouseEnter={() => !isExpanded && setHoveredItem(item.label)}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`w-full sidebar-item ${isActive(item)
                                 ? 'sidebar-item-active'
                                 : 'sidebar-item-inactive'
                                 } ${!isExpanded ? 'justify-center px-0 h-11' : 'justify-between'}`}
                           >
                              <div className="flex items-center gap-3">
                                 <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive(item) ? 'text-f1-red' : 'text-f1-silver/70'}`} />
                                 {isExpanded && <span className="font-medium text-sm">{item.label}</span>}
                              </div>
                              {isExpanded && (
                                 openSections[item.label]
                                    ? <ChevronDown className="w-3.5 h-3.5 text-f1-silver/60" />
                                    : <ChevronRight className="w-3.5 h-3.5 text-f1-silver/60" />
                              )}

                              {/* Tooltip for collapsed state */}
                              {!isExpanded && hoveredItem === item.label && (
                                 <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100]
                                                 bg-f1-carbon/95 border border-white/[0.1] rounded-lg px-3 py-1.5
                                                 text-xs font-mono font-medium text-f1-white shadow-2xl whitespace-nowrap
                                                 animate-fade-in pointer-events-none backdrop-blur-xl">
                                    {item.label}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0
                                                    border-t-4 border-b-4 border-r-4
                                                    border-t-transparent border-b-transparent border-r-f1-carbon/95" />
                                 </div>
                              )}
                           </button>
                           {isExpanded && openSections[item.label] && (
                              <div className="mt-1 ml-5 pl-3 border-l border-f1-red/20 space-y-0.5 animate-fade-in">
                                 {item.subItems.map((sub) => (
                                    <Link
                                       key={sub.path}
                                       to={sub.path}
                                       onClick={() => setMobileOpen(false)}
                                       className={`block px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 ${location.pathname === sub.path
                                          ? 'text-f1-red-light bg-f1-red/[0.08] font-bold shadow-[inset_2px_0_0_#E10600]'
                                          : 'text-f1-silver/60 hover:text-f1-white hover:bg-white/[0.03]'
                                          }`}
                                    >
                                       {sub.label}
                                    </Link>
                                 ))}
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="relative">
                           <Link
                              to={item.path!}
                              onClick={() => setMobileOpen(false)}
                              onMouseEnter={() => !isExpanded && setHoveredItem(item.label)}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`sidebar-item ${location.pathname === item.path
                                 ? 'sidebar-item-active'
                                 : 'sidebar-item-inactive'
                                 } ${!isExpanded ? 'justify-center px-0 h-11' : ''}`}
                           >
                              <item.icon className={`w-5 h-5 shrink-0 transition-colors ${location.pathname === item.path ? 'text-f1-red' : 'text-f1-silver/70'}`} />
                              {isExpanded && <span className="font-medium text-sm">{item.label}</span>}
                           </Link>

                           {/* Tooltip for collapsed state */}
                           {!isExpanded && hoveredItem === item.label && (
                              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100]
                                              bg-f1-carbon/95 border border-white/[0.1] rounded-lg px-3 py-1.5
                                              text-xs font-mono font-medium text-f1-white shadow-2xl whitespace-nowrap
                                              animate-fade-in pointer-events-none backdrop-blur-xl">
                                 {item.label}
                                 <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0
                                                 border-t-4 border-b-4 border-r-4
                                                 border-t-transparent border-b-transparent border-r-f1-carbon/95" />
                              </div>
                           )}
                        </div>
                     )}

                     {/* Section dividers */}
                     {(idx === 1 || idx === 5) && (
                        <div className="mx-2 my-2.5 carbon-divider" />
                     )}
                  </div>
               ))}
            </div>
         </div>
      );
   };

   return (
      <>
         {/* Mobile Top Bar */}
         <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-f1-abyss/95 backdrop-blur-xl border-b border-white/[0.05] px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/[0.07] rounded-lg flex items-center justify-center border border-white/10 shadow-sm p-1">
                  <img src={logoPng} alt="Pitwall Logo" className="w-full h-full object-contain" />
               </div>
               <span className="font-display font-black tracking-tight text-f1-white">F1 HUD</span>
            </Link>
            <button
               onClick={() => setMobileOpen(!mobileOpen)}
               className="p-2 rounded-lg text-f1-silver hover:text-f1-white hover:bg-white/[0.05]"
            >
               {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
         </div>

         {/* Mobile Overlay */}
         {mobileOpen && (
            <div
               className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
               onClick={() => setMobileOpen(false)}
            />
         )}

         {/* Sidebar Container */}
         <nav
            className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
               md:translate-x-0 ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
               ${collapsed ? 'md:w-[72px]' : 'md:w-64'}`}
         >
            {renderSidebarContent(mobileOpen)}
         </nav>
      </>
   );
};

export default Sidebar;
