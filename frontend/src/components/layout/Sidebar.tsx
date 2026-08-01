import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Calendar, Map,
  Menu, X, Flag, ChevronDown, ChevronRight, Activity, GitCompare, Award, Wand2
} from 'lucide-react';

interface NavItem {
  path?: string;
  label: string;
  icon: React.ElementType;
  subItems?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Standings', icon: Trophy,
    subItems: [
      { path: '/drivers', label: 'Drivers' },
      { path: '/constructors', label: 'Constructors' },
      { path: '/timeline', label: 'Timeline' },
    ]
  },
  { path: '/races', label: 'Races', icon: Calendar },
  { path: '/circuits', label: 'Circuits', icon: Map },
  {
    label: 'Analytics', icon: Activity,
    subItems: [
      { path: '/momentum', label: 'Momentum Tracker' },
      { path: '/analytics/consistency', label: 'Consistency' },
      { path: '/statistics', label: 'Statistics' },
    ]
  },
  {
    label: 'Compare', icon: GitCompare,
    subItems: [
      { path: '/compare/drivers', label: 'Drivers' },
      { path: '/compare/constructors', label: 'Constructors' },
    ]
  },
  { path: '/predictor', label: 'Predictor', icon: Wand2 },
  { path: '/records', label: 'Records', icon: Award },
];

const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const location = useLocation();

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (item: NavItem) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path);
    }
    return false;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-f1-black/90 backdrop-blur-xl border-r border-white/5">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 p-6 group">
        <div className="w-10 h-10 bg-f1-red rounded-xl flex items-center justify-center
                        group-hover:shadow-lg group-hover:shadow-f1-red/30 transition-all">
          <Flag className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-lg tracking-tight">F1</span>
          <span className="font-display text-f1-silver text-lg ml-1">Dashboard</span>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <div>
                <button
                  onClick={() => toggleSection(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item)
                      ? 'bg-f1-red/10 text-f1-red-light'
                      : 'text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {openSections[item.label] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {openSections[item.label] && (
                  <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          location.pathname === sub.path
                            ? 'bg-f1-red/10 text-f1-red-light'
                            : 'text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.path!}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-f1-red/10 text-f1-red-light'
                    : 'text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-f1-black/90 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-f1-red rounded-lg flex items-center justify-center">
            <Flag className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold tracking-tight">F1 Dashboard</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </nav>
    </>
  );
};

export default Sidebar;
