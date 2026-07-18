import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Main layout wrapper with sticky navbar and scrollable content.
 */
const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-f1-black">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>
      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-f1-silver text-sm">
              © 2026 F1 Dashboard — Formula 1 Race Weekend Tracker
            </p>
            <p className="text-f1-silver/50 text-xs">
              Data sourced from Jolpica F1 API & OpenF1
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
