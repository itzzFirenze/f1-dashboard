import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import EasterEggPlayer from '../ui/EasterEggPlayer';

const Layout: React.FC = () => {
   const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
      return localStorage.getItem('f1_sidebar_collapsed') === 'true';
   });

   useEffect(() => {
      const handleToggle = (e: CustomEvent<{ collapsed: boolean }>) => {
         setSidebarCollapsed(e.detail.collapsed);
      };
      window.addEventListener('f1-sidebar-toggle' as any, handleToggle);
      return () => window.removeEventListener('f1-sidebar-toggle' as any, handleToggle);
   }, []);

   return (
      <div className="min-h-screen bg-f1-abyss flex">
         <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={(c) => {
            setSidebarCollapsed(c);
            localStorage.setItem('f1_sidebar_collapsed', String(c));
         }} />
         <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'} flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
            <main className="flex-1 pt-14 md:pt-0">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
                  <Outlet />
               </div>
            </main>
            {/* Easter Egg Audio Player */}
            <EasterEggPlayer />

            {/* Footer */}
            <footer className="border-t border-white/[0.04] mt-auto">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <p className="text-f1-silver/60 text-sm">
                        © 2026 F1 Dashboard — Premium Analytics Platform
                     </p>
                     <p className="text-f1-silver/30 text-xs">
                        Data sourced from Jolpica F1 API & OpenF1
                     </p>
                  </div>
               </div>
            </footer>
         </div>
      </div>
   );
};

export default Layout;