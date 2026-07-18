import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Trophy, Calendar, Map, BarChart3,
  Menu, X, Flag
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/constructors', label: 'Constructors', icon: Trophy },
  { path: '/races', label: 'Race Schedule', icon: Calendar },
  { path: '/circuits', label: 'Circuits', icon: Map },
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-f1-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-f1-red rounded-xl flex items-center justify-center
                            group-hover:shadow-lg group-hover:shadow-f1-red/30 transition-all">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight">F1</span>
              <span className="font-display text-f1-silver text-lg ml-1">Dashboard</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-f1-red/10 text-f1-red-light'
                      : 'text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-f1-dark-gray/95 backdrop-blur-xl border-b border-white/5 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all ${
                    location.pathname === path
                      ? 'bg-f1-red/10 text-f1-red-light'
                      : 'text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
