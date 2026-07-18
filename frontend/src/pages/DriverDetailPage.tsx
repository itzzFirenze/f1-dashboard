import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Hash, Globe, Calendar } from 'lucide-react';
import { driverService } from '../services/driverService';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
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

      {/* Driver Header */}
      <div className="glass-card overflow-hidden">
        <div
          className="h-2 w-full"
          style={{ backgroundColor: driver.constructorColor }}
        />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-black text-2xl text-white shadow-lg"
              style={{ backgroundColor: driver.constructorColor }}
            >
              {driver.number}
            </div>
            <div className="flex-1">
              <p className="text-f1-silver text-sm font-medium uppercase tracking-wider mb-1">{driver.constructorName}</p>
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
                {driver.firstName} <span className="gradient-text">{driver.lastName}</span>
              </h1>
              <div className="flex items-center gap-4 mt-2 text-f1-silver text-sm">
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{driver.nationality}</span>
                {driver.dateOfBirth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(driver.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-6xl font-display font-black text-f1-light-gray/30">#{driver.code}</span>
            </div>
          </div>
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
