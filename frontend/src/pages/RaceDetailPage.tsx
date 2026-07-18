import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Ruler, CornerDownRight, Timer, Zap, Trophy } from 'lucide-react';
import { raceService } from '../services/raceService';
import WeatherCard from '../components/ui/WeatherCard';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import type { RaceDetail, RaceResult } from '../types';

type ResultTab = 'race' | 'qualifying' | 'sprint';

const RaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [race, setRace] = useState<RaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ResultTab>('race');

  useEffect(() => {
    if (id) {
      raceService.getById(Number(id))
        .then((data) => {
          setRace(data);
          // Auto-select a tab that has data
          if (data.results.length > 0) setActiveTab('race');
          else if (data.qualifyingResults.length > 0) setActiveTab('qualifying');
          else if (data.sprintResults.length > 0) setActiveTab('sprint');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!race) return null;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (time: string) => time?.substring(0, 5) || '';

  const hasRace = race.results.length > 0;
  const hasSprint = race.sprintResults.length > 0;
  const hasQuali = race.qualifyingResults.length > 0;
  const hasAnyResults = hasRace || hasSprint || hasQuali;

  const getActiveResults = (): RaceResult[] => {
    switch (activeTab) {
      case 'race': return race.results;
      case 'sprint': return race.sprintResults;
      case 'qualifying': return race.qualifyingResults;
      default: return [];
    }
  };

  const getTabLabel = (tab: ResultTab): string => {
    switch (tab) {
      case 'race': return 'Race';
      case 'sprint': return 'Sprint';
      case 'qualifying': return 'Qualifying';
    }
  };

  const tabs: ResultTab[] = [];
  if (hasRace) tabs.push('race');
  if (hasQuali) tabs.push('qualifying');
  if (hasSprint) tabs.push('sprint');

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/races" className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Schedule</span>
      </Link>

      {/* Race Header */}
      <div className="glass-card-red p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-f1-silver text-sm font-medium">Round {race.round}</span>
              {race.sprintWeekend && (
                <span className="badge bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Zap className="w-3 h-3 mr-1" />Sprint Weekend
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black">{race.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-f1-silver">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{race.circuit.location}, {race.circuit.country}</span>
            </div>
          </div>
          <span className={race.status === 'COMPLETED' ? 'badge-completed' : 'badge-upcoming'}>
            {race.status === 'COMPLETED' ? '✓ Completed' : 'Upcoming'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Session Schedule */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-f1-red" />
              Session Schedule
            </h2>
            <div className="space-y-2">
              {race.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-f1-mid-gray/30 hover:bg-f1-mid-gray/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      session.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-f1-red'
                    }`} />
                    <span className="font-medium">{session.sessionDisplayName}</span>
                  </div>
                  <div className="text-right text-sm text-f1-silver">
                    <span>{formatDate(session.sessionDate)}</span>
                    <span className="ml-3 font-mono">{formatTime(session.sessionTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results with Tabs */}
          {hasAnyResults && (
            <div className="glass-card p-6">
              {/* Tab Bar */}
              <div className="flex items-center gap-1 mb-5 border-b border-f1-mid-gray/50 pb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === tab
                        ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                        : 'text-f1-silver hover:text-f1-white hover:bg-f1-mid-gray/40'
                    }`}
                  >
                    {tab === 'race' && <Trophy className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                    {tab === 'sprint' && <Zap className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                    {getTabLabel(tab)}
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="space-y-1">
                {getActiveResults().map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-f1-mid-gray/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        result.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                        result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                        result.position === 3 ? 'bg-orange-700/20 text-orange-400' :
                        'bg-f1-mid-gray text-f1-silver'
                      }`}>
                        {result.position}
                      </span>
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: result.constructorColor }} />
                      <div>
                        <span className="font-semibold">{result.driverFirstName} {result.driverLastName}</span>
                        <span className="text-f1-silver text-sm ml-2">{result.constructorName}</span>
                      </div>
                      {result.fastestLap && <span className="text-purple-400 text-xs font-bold">FL</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-display font-bold">{result.points}</span>
                      <span className="text-f1-silver text-xs ml-1">PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Circuit + Weather */}
        <div className="space-y-4">
          {/* Circuit Info */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-f1-silver uppercase tracking-wider mb-4">Circuit Info</h3>
            <Link to="/circuits" className="block">
              <h4 className="text-lg font-bold mb-3 hover:text-f1-red-light transition-colors">{race.circuit.name}</h4>
            </Link>
            <div className="space-y-3">
              {[
                { icon: Ruler, label: 'Length', value: `${race.circuit.lengthKm} km` },
                { icon: CornerDownRight, label: 'Corners', value: race.circuit.corners },
                { icon: Timer, label: 'Lap Record', value: race.circuit.lapRecord },
              ].map(({ icon: Icon, label, value }) => value && (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-f1-silver">
                    <Icon className="w-4 h-4" />{label}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
              {race.circuit.lapRecordHolder && (
                <p className="text-xs text-f1-silver/60 mt-1">Record by {race.circuit.lapRecordHolder}</p>
              )}
            </div>
          </div>

          {/* Weather */}
          {race.weather && <WeatherCard weather={race.weather} />}
        </div>
      </div>
    </div>
  );
};

export default RaceDetailPage;
