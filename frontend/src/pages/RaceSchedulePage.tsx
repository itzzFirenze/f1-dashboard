import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Zap } from 'lucide-react';
import { raceService } from '../services/raceService';
import SearchInput from '../components/ui/SearchInput';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Race } from '../types';

const RaceSchedulePage: React.FC = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      raceService.getAll(2026, statusFilter || undefined, search || undefined)
        .then(setRaces)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  if (loading) return <PageSkeleton />;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Race Schedule</h1>
          <p className="text-f1-silver mt-1">2026 Season Calendar</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            {['', 'COMPLETED', 'UPCOMING'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-f1-red text-white'
                    : 'bg-f1-mid-gray text-f1-silver hover:text-f1-white'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="w-56">
            <SearchInput value={search} onChange={setSearch} placeholder="Search races..." />
          </div>
        </div>
      </div>

      {races.length === 0 ? (
        <EmptyState title="No races found" message="Try adjusting your search or filter." />
      ) : (
        <div className="grid gap-3">
          {races.map((race, i) => (
            <Link key={race.id} to={`/races/${race.id}`}>
              <div
                className="glass-card p-4 sm:p-5 flex items-center gap-4 group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Round */}
                <div className="w-12 h-12 bg-f1-mid-gray rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-f1-silver uppercase">R</span>
                  <span className="font-display font-bold text-lg leading-none">{race.round}</span>
                </div>

                {/* Race Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate group-hover:text-f1-white transition-colors">{race.name}</h3>
                    {race.sprintWeekend && (
                      <span className="badge bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Zap className="w-3 h-3 mr-1" />Sprint
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-f1-silver">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{race.circuitName}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{race.country}</span>
                  </div>
                </div>

                {/* Date + Status */}
                <div className="text-right flex-shrink-0 flex items-center gap-4">
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{formatDate(race.raceDate)}</p>
                  </div>
                  <span className={race.status === 'COMPLETED' ? 'badge-completed' : 'badge-upcoming'}>
                    {race.status === 'COMPLETED' ? '✓ Completed' : 'Upcoming'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-f1-silver/30 group-hover:text-f1-white transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaceSchedulePage;
