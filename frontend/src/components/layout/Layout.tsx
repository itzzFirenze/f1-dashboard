import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
   return (
      <div className="min-h-screen bg-f1-black flex">
         <Sidebar />
         <div className="flex-1 md:ml-64 flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden">
            <main className="flex-1 pt-16 md:pt-0">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
                  <Outlet />
               </div>
            </main>
            {/* Footer */}
            <footer className="border-t border-white/5 mt-auto">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <p className="text-f1-silver text-sm">
                        © 2026 F1 Dashboard — Premium Analytics Platform
                     </p>
                     <p className="text-f1-silver/50 text-xs">
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