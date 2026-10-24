import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
   Clock, Ruler, CornerDownRight, Timer, Zap, Trophy,
   Compass, Radio, Flag, ChevronUp, ChevronDown
} from 'lucide-react';
import { raceService } from '../services/raceService';
import { practiceService } from '../services/practiceService';
import WeatherCard from '../components/ui/WeatherCard';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { useTimezone } from '../context/TimezoneContext';
import BackButton from '../components/ui/BackButton';
import type { RaceDetail, RaceResult } from '../types';

type ResultTab = 'race' | 'qualifying' | 'sprint' | 'sprint_qualifying' | 'fp1' | 'fp2' | 'fp3';

const RaceDetailPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const [searchParams] = useSearchParams();
   const [race, setRace] = useState<RaceDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<ResultTab>('race');
   const [practiceData, setPracticeData] = useState<{
      fp1: RaceResult[] | null;
      fp2: RaceResult[] | null;
      fp3: RaceResult[] | null;
   }>({
      fp1: null,
      fp2: null,
      fp3: null,
   });
   const [practiceLoading, setPracticeLoading] = useState<boolean>(false);
   const { formatSession, resolvedTimeZone, tzAbbr, tzOffset } = useTimezone();

   useEffect(() => {
      if (id) {
         raceService.getById(Number(id))
            .then((data) => {
               setRace(data);

               const cachedFp1 =
                  data.fp1Results && data.fp1Results.length > 0
                     ? data.fp1Results
                     : practiceService.getCachedPracticeResults(data.id, 'fp1');
               const cachedFp2 =
                  data.fp2Results && data.fp2Results.length > 0
                     ? data.fp2Results
                     : practiceService.getCachedPracticeResults(data.id, 'fp2');
               const cachedFp3 =
                  data.fp3Results && data.fp3Results.length > 0
                     ? data.fp3Results
                     : practiceService.getCachedPracticeResults(data.id, 'fp3');

               setPracticeData({
                  fp1: cachedFp1,
                  fp2: cachedFp2,
                  fp3: cachedFp3,
               });

               // Silent background prefetching so practice tabs load instantly with 0 wait
               if (!cachedFp1) {
                  practiceService.getPracticeResults(data, 'fp1')
                     .then((res) => setPracticeData((prev) => ({ ...prev, fp1: res })))
                     .catch(() => {});
               }
               if (!data.sprintWeekend) {
                  if (!cachedFp2) {
                     practiceService.getPracticeResults(data, 'fp2')
                        .then((res) => setPracticeData((prev) => ({ ...prev, fp2: res })))
                        .catch(() => {});
                  }
                  if (!cachedFp3) {
                     practiceService.getPracticeResults(data, 'fp3')
                        .then((res) => setPracticeData((prev) => ({ ...prev, fp3: res })))
                        .catch(() => {});
                  }
               }

               const tabParam = searchParams.get('tab') as ResultTab | null;
               if (tabParam && ['race', 'qualifying', 'sprint', 'sprint_qualifying', 'fp1', 'fp2', 'fp3'].includes(tabParam)) {
                  setActiveTab(tabParam);
               } else if (data.results.length > 0) {
                  setActiveTab('race');
               } else if (data.qualifyingResults.length > 0) {
                  setActiveTab('qualifying');
               } else if (data.sprintResults.length > 0) {
                  setActiveTab('sprint');
               } else if (data.sprintQualifyingResults && data.sprintQualifyingResults.length > 0) {
                  setActiveTab('sprint_qualifying');
               } else if (data.fp1Results && data.fp1Results.length > 0) {
                  setActiveTab('fp1');
               }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [id, searchParams]);

   // Fetch practice results on-demand if not yet available
   useEffect(() => {
      if (!race) return;
      if (activeTab === 'fp1' || activeTab === 'fp2' || activeTab === 'fp3') {
         if (practiceData[activeTab] === null) {
            setPracticeLoading(true);
            practiceService
               .getPracticeResults(race, activeTab)
               .then((results) => {
                  setPracticeData((prev) => ({ ...prev, [activeTab]: results }));
               })
               .catch((err) => {
                  console.error(`Failed to load ${activeTab} results:`, err);
                  setPracticeData((prev) => ({ ...prev, [activeTab]: [] }));
               })
               .finally(() => setPracticeLoading(false));
         }
      }
   }, [activeTab, race, practiceData]);

   if (loading) return <PageSkeleton />;
   if (!race) return null;

   const hasRace = race.results && race.results.length > 0;
   const hasSprint = race.sprintResults && race.sprintResults.length > 0;
   const hasQuali = race.qualifyingResults && race.qualifyingResults.length > 0;
   const hasSprintQuali = !!(race.sprintQualifyingResults && race.sprintQualifyingResults.length > 0);
   const isSprintWeekend = !!race.sprintWeekend;
   const hasAnyResults = hasRace || hasSprint || hasQuali || hasSprintQuali || isSprintWeekend || true;

   const getActiveResults = (): RaceResult[] => {
      switch (activeTab) {
         case 'race': return race.results;
         case 'sprint': return race.sprintResults;
         case 'qualifying': return race.qualifyingResults;
         case 'sprint_qualifying': return race.sprintQualifyingResults || [];
         case 'fp1': return practiceData.fp1 || [];
         case 'fp2': return practiceData.fp2 || [];
         case 'fp3': return practiceData.fp3 || [];
         default: return [];
      }
   };

   const getTabLabel = (tab: ResultTab): string => {
      switch (tab) {
         case 'race': return 'Race';
         case 'sprint': return 'Sprint';
         case 'qualifying': return 'Qualifying';
         case 'sprint_qualifying': return 'Sprint Qualifying';
         case 'fp1': return 'Practice 1';
         case 'fp2': return 'Practice 2';
         case 'fp3': return 'Practice 3';
      }
   };

   const getTabShortLabel = (tab: ResultTab): string => {
      switch (tab) {
         case 'race': return 'Race';
         case 'sprint': return 'Sprint';
         case 'qualifying': return 'Quali';
         case 'sprint_qualifying': return 'Sprint Quali';
         case 'fp1': return 'FP1';
         case 'fp2': return 'FP2';
         case 'fp3': return 'FP3';
      }
   };

   const tabs: ResultTab[] = [];
   if (hasRace) tabs.push('race');
   if (hasQuali) tabs.push('qualifying');
   if (hasSprint || isSprintWeekend) tabs.push('sprint');
   if (hasSprintQuali || isSprintWeekend) tabs.push('sprint_qualifying');
   tabs.push('fp1');
   if (!isSprintWeekend) {
      tabs.push('fp2');
      tabs.push('fp3');
   }

   const isCompleted = race.status === 'COMPLETED';

   const currentPracticeSession =
      activeTab === 'fp1'
         ? race.sessions?.find((s) => s.sessionType === 'FP1' || s.sessionDisplayName?.toLowerCase().includes('practice 1'))
         : activeTab === 'fp2'
         ? race.sessions?.find((s) => s.sessionType === 'FP2' || s.sessionDisplayName?.toLowerCase().includes('practice 2'))
         : activeTab === 'fp3'
         ? race.sessions?.find((s) => s.sessionType === 'FP3' || s.sessionDisplayName?.toLowerCase().includes('practice 3'))
         : null;

   return (
      <div className="space-y-7 animate-fade-in">
         <BackButton />

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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                     <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-sky-400/10 border border-sky-400/20 text-sky-400">
                           <Clock className="w-4 h-4" />
                        </div>
                        <h3 className="font-display font-black text-sm uppercase tracking-widest text-f1-white">
                           Weekend Schedule
                        </h3>
                     </div>
                     <span className="text-[10px] font-mono text-f1-silver/50 tracking-wider">
                        {resolvedTimeZone} ({tzAbbr}, {tzOffset})
                     </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                     {race.sessions && race.sessions.length > 0 ? (
                        race.sessions.map((session) => {
                           const formatted = formatSession(session.sessionDate, session.sessionTime);
                           return (
                              <div
                                 key={session.id}
                                 className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
                              >
                                 <p className="text-xs font-mono font-semibold text-f1-silver uppercase tracking-wider mb-1">
                                    {session.sessionDisplayName}
                                 </p>
                                 <p className="text-sm font-display font-bold text-f1-white">
                                    {formatted.dateStr}
                                 </p>
                                 {session.sessionTime && (
                                    <p className="text-xs font-mono text-f1-silver/70 mt-0.5">
                                       {formatted.timeStr}
                                    </p>
                                 )}
                              </div>
                           );
                        })
                     ) : (
                        <p className="text-sm font-mono text-f1-silver/50 col-span-full py-4 text-center">
                           No session timings scheduled
                        </p>
                     )}
                  </div>
               </div>

               {/* Classification Results Card */}
               {hasAnyResults && (
                  <div className="telemetry-card p-4 sm:p-6 relative overflow-hidden">
                     <div
                        className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                        style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
                     />

                     {/* Tab Bar */}
                     <div className="flex items-center gap-1.5 mb-4 sm:mb-5 border-b border-white/[0.06] pb-3 sm:pb-4 overflow-x-auto no-scrollbar scroll-smooth">
                        {tabs.map((tab) => (
                           <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider sm:tracking-widest transition-all whitespace-nowrap shrink-0 flex items-center gap-1 sm:gap-1.5 ${
                                 activeTab === tab
                                    ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                                    : 'text-f1-silver/70 hover:text-f1-white hover:bg-white/[0.04]'
                              }`}
                           >
                              {tab === 'race' && <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
                              {(tab === 'qualifying' || tab === 'fp1' || tab === 'fp2' || tab === 'fp3') && (
                                 <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                              )}
                              {(tab === 'sprint' || tab === 'sprint_qualifying') && (
                                 <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                              )}
                              <span className="sm:hidden">{getTabShortLabel(tab)}</span>
                              <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                           </button>
                        ))}
                     </div>

                     {/* Qualifying / Sprint Qualifying Sub-header */}
                     {(activeTab === 'qualifying' || activeTab === 'sprint_qualifying') && (
                        <div className="hidden sm:flex items-center justify-end gap-2 sm:gap-6 px-2 sm:px-3 pb-2 text-[9px] sm:text-[10px] font-mono font-semibold text-f1-silver/50 uppercase tracking-[0.2em]">
                           <span className="w-20 sm:w-24 text-center">{activeTab === 'sprint_qualifying' ? 'SQ1' : 'Q1'}</span>
                           <span className="w-20 sm:w-24 text-center">{activeTab === 'sprint_qualifying' ? 'SQ2' : 'Q2'}</span>
                           <span className="w-20 sm:w-24 text-center">{activeTab === 'sprint_qualifying' ? 'SQ3' : 'Q3'}</span>
                        </div>
                     )}

                     {/* Practice (FP1 / FP2 / FP3) Sub-header */}
                     {(activeTab === 'fp1' || activeTab === 'fp2' || activeTab === 'fp3') && (
                        <div className="hidden sm:flex items-center justify-end gap-2 sm:gap-6 px-2 sm:px-3 pb-2 text-[9px] sm:text-[10px] font-mono font-semibold text-f1-silver/50 uppercase tracking-[0.2em]">
                           <span className="w-20 sm:w-24 text-center">Time</span>
                           <span className="w-20 sm:w-24 text-center">Gap</span>
                           <span className="w-20 sm:w-24 text-center">Laps</span>
                        </div>
                     )}

                     {/* Results List */}
                     <div className="space-y-1">
                        {practiceLoading && (activeTab === 'fp1' || activeTab === 'fp2' || activeTab === 'fp3') && getActiveResults().length === 0 ? (
                           <div className="space-y-2 py-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                 <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className="w-7 h-7 rounded-lg bg-white/[0.05]" />
                                       <div className="w-1 h-5 rounded-full bg-white/[0.08]" />
                                       <div className="space-y-1.5">
                                          <div className="w-32 h-3.5 rounded bg-white/[0.07]" />
                                          <div className="w-20 h-2.5 rounded bg-white/[0.04]" />
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                       <div className="w-20 sm:w-24 h-4 rounded bg-white/[0.07]" />
                                       <div className="w-20 sm:w-24 h-4 rounded bg-white/[0.05]" />
                                       <div className="w-20 sm:w-24 h-4 rounded bg-white/[0.05]" />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : getActiveResults().length === 0 ? (
                           <div className="py-12 px-6 text-center bg-white/[0.01] rounded-2xl border border-white/[0.04] space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-f1-silver/60 mx-auto flex items-center justify-center">
                                 <Timer className="w-6 h-6 text-f1-silver/60" />
                              </div>
                              <div>
                                 <h4 className="text-sm sm:text-base font-display font-bold text-f1-white uppercase tracking-wider mb-1">
                                    No {getTabLabel(activeTab)} Classification Available
                                 </h4>
                                 <p className="text-f1-silver/60 font-mono text-xs max-w-md mx-auto">
                                    {currentPracticeSession ? (
                                       <>
                                          Scheduled for{' '}
                                          <span className="text-f1-white font-semibold">
                                             {formatSession(currentPracticeSession.sessionDate, currentPracticeSession.sessionTime).dateStr}
                                          </span>
                                          {currentPracticeSession.sessionTime && (
                                             <>
                                                {' '}
                                                at{' '}
                                                <span className="text-f1-white font-semibold">
                                                   {formatSession(currentPracticeSession.sessionDate, currentPracticeSession.sessionTime).timeStr}
                                                </span>
                                             </>
                                          )}
                                       </>
                                    ) : (
                                       `Timing classification is not available for this session.`
                                    )}
                                 </p>
                              </div>
                           </div>
                        ) : (
                           getActiveResults().map((result) => {
                              const isQualiType = activeTab === 'qualifying' || activeTab === 'sprint_qualifying';
                              const isPracticeType = activeTab === 'fp1' || activeTab === 'fp2' || activeTab === 'fp3';

                              if (isPracticeType) {
                                 const bestLapStr =
                                    result.lapTime ||
                                    result.q1 ||
                                    (result.status && result.status !== 'NO TIME' ? result.status : null);
                                 const isLeader = result.position === 1;

                                 return (
                                    <div
                                       key={result.id || `${result.driverCode}-${result.position}`}
                                       className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-white/[0.03] transition-colors group gap-2"
                                    >
                                       {/* Left: Position badge, team color bar, driver name */}
                                       <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                          <span
                                             className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-mono font-bold shrink-0 ${
                                                result.position === 1
                                                   ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                   : result.position === 2
                                                   ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30'
                                                   : result.position === 3
                                                   ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30'
                                                   : 'bg-white/[0.04] text-f1-silver border border-white/[0.04]'
                                             }`}
                                          >
                                             {result.position}
                                          </span>

                                          <div
                                             className="w-1 h-4 sm:h-5 rounded-full shrink-0"
                                             style={{ backgroundColor: result.constructorColor || '#94a3b8' }}
                                          />

                                          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                             <span className="font-semibold text-xs sm:text-sm text-f1-white truncate">
                                                {result.driverFirstName} {result.driverLastName}
                                             </span>
                                             <span className="text-f1-silver/70 text-xs font-mono hidden sm:inline">
                                                {result.constructorName}
                                             </span>

                                             {/* Mobile-only timing info */}
                                             <div className="w-full flex sm:hidden items-center gap-3 mt-1 font-mono text-[10px] text-f1-silver/60">
                                                <span>
                                                   <span className="text-f1-silver/40">TIME:</span>{' '}
                                                   <span className="text-f1-white font-bold">{bestLapStr || '—'}</span>
                                                </span>
                                                <span>
                                                   <span className="text-f1-silver/40">GAP:</span> {result.gap || (isLeader ? 'LEADER' : '—')}
                                                </span>
                                                <span>
                                                   <span className="text-f1-silver/40">LAPS:</span>{' '}
                                                   {result.lapsCompleted !== undefined && result.lapsCompleted !== null ? result.lapsCompleted : '—'}
                                                </span>
                                             </div>
                                          </div>

                                          {/* Fastest Lap Badge */}
                                          {result.fastestLap && (
                                             <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-0.5 shrink-0 hidden xs:inline-block">
                                                FL
                                             </span>
                                          )}
                                       </div>

                                       {/* Right on Desktop/Tablet: Time, Gap, Laps (matching Q1, Q2, Q3 layout) */}
                                       <div className="hidden sm:flex items-center gap-2 sm:gap-6 font-mono text-xs sm:text-sm shrink-0">
                                          <span className="w-20 sm:w-24 text-center font-bold text-f1-white">
                                             {bestLapStr || '—'}
                                          </span>
                                          <span className="w-20 sm:w-24 text-center text-f1-silver/70">
                                             {result.gap || (isLeader ? 'LEADER' : '—')}
                                          </span>
                                          <span className="w-20 sm:w-24 text-center text-f1-silver/70">
                                             {result.lapsCompleted !== undefined && result.lapsCompleted !== null
                                                ? result.lapsCompleted
                                                : (result.q3 || '—').replace(/ laps/i, '')}
                                          </span>
                                       </div>
                                    </div>
                                 );
                              }

                              const hasGridPos = typeof result.gridPosition === 'number' && result.gridPosition > 0;
                              const delta = hasGridPos ? result.gridPosition - result.position : null;

                              const isDnf = !isQualiType && (() => {
                                 if (!result.status) return false;
                                 const s = result.status.trim().toLowerCase();
                                 if (
                                    s === 'finished' ||
                                    s === 'qualified' ||
                                    s === 'classified' ||
                                    s.startsWith('+') ||
                                    s.includes('lap')
                                 ) {
                                    return false;
                                 }
                                 return true;
                              })();

                              const getDnfBadge = (status: string) => {
                                 const s = status.trim().toLowerCase();
                                 if (s.includes('disqualif') || s === 'dsq') return 'DSQ';
                                 if (s.includes('did not start') || s === 'dns') return 'DNS';
                                 return 'DNF';
                              };

                              return (
                                 <div key={result.id} className={`flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-white/[0.03] transition-colors group gap-2 ${isDnf ? 'bg-rose-500/[0.02]' : ''}`}>
                                    {/* Left: Position badge, team color bar, driver name, fastest lap badge, DNF badge */}
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                       <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-mono font-bold shrink-0 ${result.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                                          result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                                             result.position === 3 ? 'bg-orange-700/20 text-orange-400' :
                                                isDnf ? 'bg-rose-500/10 text-rose-400/80 border border-rose-500/20' :
                                                   'bg-white/[0.04] text-f1-silver'
                                          }`}>
                                          {result.position}
                                       </span>

                                       <div className="w-1 h-4 sm:h-5 rounded-full shrink-0" style={{ backgroundColor: result.constructorColor }} />
                                       <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                          <span className={`font-semibold text-xs sm:text-sm truncate ${isDnf ? 'text-f1-white/90' : 'text-f1-white'}`}>
                                             {result.driverFirstName} {result.driverLastName}
                                          </span>
                                          <span className="text-f1-silver/70 text-xs font-mono hidden sm:inline">{result.constructorName}</span>

                                          {/* DNF / DSQ / DNS Badge */}
                                          {isDnf && (
                                             <span
                                                className="text-[9px] sm:text-[10px] font-mono font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded px-1.5 py-0.5 shrink-0 uppercase tracking-wider inline-flex items-center"
                                                title={result.status}
                                             >
                                                {getDnfBadge(result.status)}
                                                {result.status && !['dnf', 'dsq', 'dns', 'retired'].includes(result.status.trim().toLowerCase()) && (
                                                   <span className="ml-1 font-normal opacity-80 hidden md:inline text-[9px] font-sans capitalize">· {result.status}</span>
                                                )}
                                             </span>
                                          )}

                                          {/* Mobile-only: Q1/Q2/Q3 or SQ1/SQ2/SQ3 times shown below the driver name */}
                                          {isQualiType && (
                                             <div className="w-full flex sm:hidden items-center gap-3 mt-1 font-mono text-[10px] text-f1-silver/60">
                                                <span><span className="text-f1-silver/40">{activeTab === 'sprint_qualifying' ? 'SQ1' : 'Q1'}</span> {result.q1 || '—'}</span>
                                                <span><span className="text-f1-silver/40">{activeTab === 'sprint_qualifying' ? 'SQ2' : 'Q2'}</span> {result.q2 || '—'}</span>
                                                <span className="font-bold text-f1-white"><span className="text-f1-silver/40 font-normal">{activeTab === 'sprint_qualifying' ? 'SQ3' : 'Q3'}</span> {result.q3 || '—'}</span>
                                             </div>
                                          )}
                                       </div>
                                       {result.fastestLap && (
                                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-0.5 shrink-0 hidden xs:inline-block">
                                             FL
                                          </span>
                                       )}
                                    </div>

                                    {/* Right: Qualifying times OR (Position Delta + Points) */}
                                    {isQualiType ? (
                                       <div className="hidden sm:flex items-center gap-2 sm:gap-6 font-mono text-xs sm:text-sm shrink-0">
                                          <span className="w-20 sm:w-24 text-center text-f1-silver/70">{result.q1 || '—'}</span>
                                          <span className="w-20 sm:w-24 text-center text-f1-silver/70">{result.q2 || '—'}</span>
                                          <span className="w-20 sm:w-24 text-center font-bold text-f1-white">{result.q3 || '—'}</span>
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                          {/* Position Delta — left of the points tab */}
                                          <div className="w-7 sm:w-8 flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold shrink-0">
                                             {delta !== null ? (
                                                delta > 0 ? (
                                                   <span className="inline-flex items-center text-emerald-400 gap-0.5" title={`${delta} positions gained`}>
                                                      <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                                      <span>{delta}</span>
                                                   </span>
                                                ) : delta < 0 ? (
                                                   <span className="inline-flex items-center text-rose-500 gap-0.5" title={`${Math.abs(delta)} positions lost`}>
                                                      <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                                                      <span>{Math.abs(delta)}</span>
                                                   </span>
                                                ) : (
                                                   <span className="text-f1-white font-bold" title="Position unchanged">—</span>
                                                )
                                             ) : (
                                                <span className="text-f1-white font-bold">—</span>
                                             )}
                                          </div>

                                          {/* Points tab */}
                                          <div className="text-right min-w-[3rem]">
                                             <span className="font-display font-black text-sm sm:text-base text-amber-400">{result.points}</span>
                                             <span className="text-f1-silver/50 text-[10px] font-mono ml-1 uppercase tracking-widest">Pts</span>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              );
                           })
                        )}
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

                  <Link to={`/circuits?circuit=${encodeURIComponent(race.circuit.name)}&from=race-details`} className="block group">
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
