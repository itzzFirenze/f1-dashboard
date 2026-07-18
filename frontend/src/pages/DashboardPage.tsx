import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Flag, Users, Calendar, Timer, ChevronRight, TrendingUp, Zap
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import CountdownTimer from '../components/ui/CountdownTimer';
import WeatherCard from '../components/ui/WeatherCard';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { DashboardData } from '../types';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-f1-red/20 via-f1-dark-gray to-f1-black p-8 sm:p-10 border border-f1-red/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-f1-red/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-f1-red" />
            <span className="text-f1-red-light text-sm font-semibold uppercase tracking-wider">
              Formula 1
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight mb-2">
            {data.currentSeason} Season
          </h1>
          <p className="text-f1-silver text-lg">
            Race Weekend Dashboard
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Flag className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-f1-silver">Completed</span>
          </div>
          <p className="stat-value text-emerald-400">{data.racesCompleted}</p>
          <p className="stat-label mt-1">races</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-f1-red/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-f1-red" />
            </div>
            <span className="text-sm text-f1-silver">Remaining</span>
          </div>
          <p className="stat-value text-f1-red-light">{data.racesRemaining}</p>
          <p className="stat-label mt-1">races</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-f1-silver">Total Races</span>
          </div>
          <p className="stat-value text-amber-400">{data.totalRaces}</p>
          <p className="stat-label mt-1">Grand Prix</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-f1-silver">Progress</span>
          </div>
          <p className="stat-value text-blue-400">
            {Math.round((data.racesCompleted / data.totalRaces) * 100)}%
          </p>
          <p className="stat-label mt-1">season</p>
        </div>
      </div>

      {/* Next Race + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next Race / Session Countdown */}
        {data.nextRaceName && (
          <Link to={`/races/${data.nextRaceId}`} className="lg:col-span-2">
            <div className="glass-card-red p-6 sm:p-8 h-full group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-f1-red" />
                  <span className="text-sm font-semibold text-f1-red-light uppercase tracking-wider">
                    Next: {data.nextSessionName || 'Race'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-f1-silver group-hover:text-f1-red transition-colors" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1">
                {data.nextRaceName}
              </h2>
              <p className="text-f1-silver mb-6">
                {data.nextRaceCircuit} — {data.nextRaceCountry}
              </p>
              <CountdownTimer targetDate={
                data.nextSessionTime
                  ? `${data.nextSessionDate}T${data.nextSessionTime}Z`
                  : data.nextSessionDate || ''
              } />
            </div>
          </Link>
        )}

        {/* Weather */}
        {data.nextRaceWeather && <WeatherCard weather={data.nextRaceWeather} />}
      </div>

      {/* Championship Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver Championship Leader */}
        {data.driverChampionshipLeader && (
          <Link to={`/drivers/${data.driverChampionshipLeader.id}`}>
            <div className="glass-card p-6 group cursor-pointer hover:border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-semibold text-f1-silver uppercase tracking-wider">
                    Driver Championship Leader
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-f1-silver group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl text-white"
                  style={{ backgroundColor: data.driverChampionshipLeader.constructorColor }}
                >
                  {data.driverChampionshipLeader.code}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {data.driverChampionshipLeader.firstName} {data.driverChampionshipLeader.lastName}
                  </h3>
                  <p className="text-f1-silver text-sm">{data.driverChampionshipLeader.constructorName}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-display font-bold text-amber-400">
                    {data.driverChampionshipLeader.points}
                  </p>
                  <p className="text-xs text-f1-silver">PTS</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Constructor Championship Leader */}
        {data.constructorChampionshipLeader && (
          <Link to={`/constructors/${data.constructorChampionshipLeader.id}`}>
            <div className="glass-card p-6 group cursor-pointer hover:border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-semibold text-f1-silver uppercase tracking-wider">
                    Constructor Championship Leader
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-f1-silver group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: data.constructorChampionshipLeader.color }}
                >
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{data.constructorChampionshipLeader.name}</h3>
                  <p className="text-f1-silver text-sm">{data.constructorChampionshipLeader.nationality}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-display font-bold text-amber-400">
                    {data.constructorChampionshipLeader.points}
                  </p>
                  <p className="text-xs text-f1-silver">PTS</p>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/drivers', label: 'Driver Standings', icon: Users, color: 'text-blue-400' },
          { to: '/constructors', label: 'Team Standings', icon: Trophy, color: 'text-amber-400' },
          { to: '/races', label: 'Race Schedule', icon: Calendar, color: 'text-emerald-400' },
          { to: '/statistics', label: 'Statistics', icon: TrendingUp, color: 'text-purple-400' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to}>
            <div className="glass-card p-4 flex items-center gap-3 group cursor-pointer">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm font-medium text-f1-silver group-hover:text-f1-white transition-colors">
                {label}
              </span>
              <ChevronRight className="w-4 h-4 text-f1-silver/50 ml-auto group-hover:text-f1-white transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
