import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
   ArrowLeft, Clock, MapPin, Ruler, CornerDownRight, Timer, Zap, Trophy,
   Compass, Radio, Flag
} from 'lucide-react';
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

   const isCompleted = race.status === 'COMPLETED';

   return (
      <div className="space-y-7 animate-fade-in">
         <Link
            to="/races"
            className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors group w-fit"
         >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-mono uppercase tracking-widest">Back to Schedule</span>
         </Link>

         {/* ─── Race Header: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-7 sm:p-9 shadow-2xl dot-grid">
            {/* Scanline texture */}
            <div className="scanline-overlay" />

            {/* Futuristic ambient glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Diagonal accent slash line */}
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-f1-red/[0.04] to-transparent transform skew-x-12 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
               <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                        <Flag className="w-3.5 h-3.5 text-f1-red-light" />
                        <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                           Round {race.round}
                        </span>
                     </div>
                     {race.sprintWeekend && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25 uppercase tracking-widest">
                           <Zap className="w-3 h-3" />Sprint Weekend
                        </span>
                     )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase">
                     {race.name}
                  </h1>

                  <p className="text-f1-silver text-sm sm:text-base font-mono mt-1.5 flex items-center gap-2">
                     <Compass className="w-4 h-4 text-f1-red" />
                     <span>{race.circuit.location}</span>
                     <span className="text-f1-silver/40">|</span>
                     <span className="text-f1-white font-semibold">{race.circuit.country}</span>
                  </p>
               </div>

               <span className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] tracking-[0.15em] uppercase shrink-0">
                  <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-f1-red animate-ping'}`} />
                  <span className={isCompleted ? 'text-emerald-400' : 'text-f1-red-light'}>
                     {isCompleted ? 'Session Complete' : 'Upcoming'}
                  </span>
               </span>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
               {/* Session Schedule */}
               <div className="telemetry-card p-6 relative overflow-hidden">
                  <div
                     className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                     style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}
                  />
                  <div className="flex items-center gap-2.5 mb-4">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06]" style={{ backgroundColor: '#38bdf815' }}>
                        <Clock className="w-4 h-4" style={{ color: '#38bdf8' }} />
                     </div>
                     <span className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">
                        Session Schedule
                     </span>
                  </div>
                  <div className="space-y-2">
                     {race.sessions.map((session) => (
                        <div
                           key={session.id}
                           className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${session.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-f1-red'
                                 }`} />
                              <span className="font-medium text-sm">{session.sessionDisplayName}</span>
                           </div>
                           <div className="text-right text-xs font-mono text-f1-silver">
                              <span className="uppercase tracking-wider">{formatDate(session.sessionDate)}</span>
                              <span className="ml-3 font-bold text-f1-white">{formatTime(session.sessionTime)}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Results with Tabs */}
               {hasAnyResults && (
                  <div className="telemetry-card p-3.5 sm:p-6 relative overflow-hidden">
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                        style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
                     />

                     {/* Tab Bar */}
                     <div className="flex items-center gap-1 mb-4 sm:mb-5 border-b border-white/[0.06] pb-3 sm:pb-4">
                        {tabs.map((tab) => (
                           <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider sm:tracking-widest transition-all ${activeTab === tab
                                 ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                                 : 'text-f1-silver/70 hover:text-f1-white hover:bg-white/[0.04]'
                                 }`}
                           >
                              {tab === 'race' && <Trophy className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                              {tab === 'sprint' && <Zap className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                              {getTabLabel(tab)}
                           </button>
                        ))}
                     </div>

                     {/* Qualifying Sub-header (Q1/Q2/Q3 column labels) */}
                     {activeTab === 'qualifying' && (
                        <div className="flex items-center justify-end gap-2 sm:gap-6 px-2 sm:px-3 pb-2 text-[9px] sm:text-[10px] font-mono font-semibold text-f1-silver/50 uppercase tracking-[0.2em]">
                           <span className="w-12 sm:w-16 text-center">Q1</span>
                           <span className="w-12 sm:w-16 text-center">Q2</span>
                           <span className="w-12 sm:w-16 text-center">Q3</span>
                        </div>
                     )}

                     {/* Results List */}
                     <div className="space-y-1">
                        {getActiveResults().map((result) => (
                           <div key={result.id} className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-white/[0.03] transition-colors group gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                 <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-mono font-bold shrink-0 ${result.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                                    result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                                       result.position === 3 ? 'bg-orange-700/20 text-orange-400' :
                                          'bg-white/[0.04] text-f1-silver'
                                    }`}>
                                    {result.position}
                                 </span>
                                 <div className="w-1 h-4 sm:h-5 rounded-full shrink-0" style={{ backgroundColor: result.constructorColor }} />
                                 <div className="min-w-0">
                                    <span className="font-semibold text-xs sm:text-sm truncate block sm:inline">{result.driverFirstName} {result.driverLastName}</span>
                                    <span className="text-f1-silver/70 text-xs font-mono ml-2 hidden sm:inline">{result.constructorName}</span>
                                 </div>
                                 {result.fastestLap && (
                                    <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-0.5 shrink-0 hidden xs:inline-block">
                                       FL
                                    </span>
                                 )}
                              </div>

                              {activeTab === 'qualifying' ? (
                                 <div className="flex items-center gap-2 sm:gap-6 font-mono text-xs sm:text-sm shrink-0">
                                    <span className="w-12 sm:w-16 text-center text-f1-silver/70 truncate">{result.q1 || '—'}</span>
                                    <span className="w-12 sm:w-16 text-center text-f1-silver/70 truncate">{result.q2 || '—'}</span>
                                    <span className="w-12 sm:w-16 text-center font-bold text-f1-white truncate">{result.q3 || '—'}</span>
                                 </div>
                              ) : (
                                 <div className="text-right shrink-0">
                                    <span className="font-display font-black text-sm sm:text-base text-amber-400">{result.points}</span>
                                    <span className="text-f1-silver/50 text-[10px] font-mono ml-1 uppercase tracking-widest">Pts</span>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* Sidebar: Circuit + Weather */}
            <div className="space-y-5">
               {/* Circuit Info */}
               <div className="diagonal-card p-6 relative">
                  <div
                     className="absolute left-0 top-0 bottom-0 w-1.5"
                     style={{ backgroundColor: '#f59e0b' }}
                  />
                  <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/[0.04]">
                     <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                        <Radio className="w-4 h-4" />
                     </div>
                     <span className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest">
                        Circuit Telemetry
                     </span>
                  </div>

                  <Link to="/circuits" className="block group">
                     <h4 className="text-xl font-display font-black text-f1-white mb-4 group-hover:text-f1-red-light transition-colors">
                        {race.circuit.name}
                     </h4>
                  </Link>

                  <div className="space-y-3">
                     {[
                        { icon: Ruler, label: 'Length', value: `${race.circuit.lengthKm} km` },
                        { icon: CornerDownRight, label: 'Corners', value: race.circuit.corners },
                        { icon: Timer, label: 'Lap Record', value: race.circuit.lapRecord },
                     ].map(({ icon: Icon, label, value }) => value && (
                        <div key={label} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                           <span className="flex items-center gap-2 text-f1-silver/70 text-xs font-mono uppercase tracking-wider">
                              <Icon className="w-3.5 h-3.5" />{label}
                           </span>
                           <span className="font-mono font-bold text-f1-white">{value}</span>
                        </div>
                     ))}
                     {race.circuit.lapRecordHolder && (
                        <p className="text-xs text-f1-silver/70 mt-1 flex items-center gap-1.5 font-mono px-1">
                           <span className="text-f1-silver/50 uppercase tracking-wider">Record by</span>
                           <span className="font-semibold text-f1-white">{race.circuit.lapRecordHolder}</span>
                        </p>
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