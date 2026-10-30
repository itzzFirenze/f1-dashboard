import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
   Clock, Ruler, CornerDownRight, Timer, Zap, Trophy,
   Compass, Radio, Flag, ChevronUp, ChevronDown
} from 'lucide-react';
import { raceService } from '../services/raceService';
import {
   telemetryService,
   OpenF1Session,
   OpenF1Driver,
   OpenF1Stint,
   OpenF1Pit,
   OpenF1Interval
} from '../services/telemetryService';
import WeatherCard from '../components/ui/WeatherCard';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { useTimezone } from '../context/TimezoneContext';
import BackButton from '../components/ui/BackButton';
import TyreStintBadge from '../components/ui/TyreStintBadge';
import type { RaceDetail, RaceResult } from '../types';

type ResultTab = 'race' | 'qualifying' | 'sprint' | 'sprint_qualifying';

const sortStints = (arr: OpenF1Stint[]) => {
   arr.sort((a, b) => (a.stint_number || a.lap_start || 0) - (b.stint_number || b.lap_start || 0));
};

const findOpenF1SessionKey = (
   sessions: OpenF1Session[],
   raceDate?: string,
   circuitLocation?: string,
   country?: string,
   raceName?: string
): number | null => {
   if (!sessions || sessions.length === 0) return null;

   const loc = (circuitLocation || '').toLowerCase().trim();
   const ctry = (country || '').toLowerCase().trim();
   const name = (raceName || '').toLowerCase().trim();

   // 1. Exact or near date match
   if (raceDate) {
      const targetDate = raceDate.slice(0, 10);
      const exact = sessions.find((s) => s.date_start && s.date_start.slice(0, 10) === targetDate);
      if (exact) return exact.session_key;

      const targetTime = new Date(targetDate).getTime();
      const near = sessions.find((s) => {
         if (!s.date_start) return false;
         const sTime = new Date(s.date_start.slice(0, 10)).getTime();
         return Math.abs(sTime - targetTime) <= 48 * 3600 * 1000;
      });
      if (near) {
         const sLoc = (near.location || '').toLowerCase();
         const sCtry = (near.country_name || '').toLowerCase();
         if (
            !loc || sLoc.includes(loc) || loc.includes(sLoc) ||
            !ctry || sCtry.includes(ctry) || ctry.includes(sCtry)
         ) {
            return near.session_key;
         }
      }
   }

   // 2. Fuzzy location/country match
   const matched = sessions.find((s) => {
      const sLoc = (s.location || '').toLowerCase();
      const sCtry = (s.country_name || '').toLowerCase();
      const sCircuit = (s.circuit_short_name || '').toLowerCase();

      return (
         (loc && (sLoc.includes(loc) || loc.includes(sLoc) || sCircuit.includes(loc) || loc.includes(sCircuit))) ||
         (ctry && (sCtry.includes(ctry) || ctry.includes(sCtry))) ||
         (name && (name.includes(sLoc) || name.includes(sCtry)))
      );
   });

   return matched ? matched.session_key : null;
};

const RaceDetailPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const [searchParams] = useSearchParams();
   const [race, setRace] = useState<RaceDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<ResultTab>('race');
   const [stintsByDriverCode, setStintsByDriverCode] = useState<Record<string, OpenF1Stint[]>>({});
   const [pitsByDriverCode, setPitsByDriverCode] = useState<Record<string, OpenF1Pit[]>>({});
   const [intervalsByDriverCode, setIntervalsByDriverCode] = useState<Record<string, OpenF1Interval>>({});
   const [, setLoadingTelemetry] = useState(false);
   const { formatSession, resolvedTimeZone, tzAbbr, tzOffset } = useTimezone();

   useEffect(() => {
      if (id) {
         raceService.getById(Number(id))
            .then((data) => {
               setRace(data);

               const tabParam = searchParams.get('tab') as ResultTab | null;
               if (tabParam && ['race', 'qualifying', 'sprint', 'sprint_qualifying'].includes(tabParam)) {
                  setActiveTab(tabParam);
               } else if (data.results && data.results.length > 0) {
                  setActiveTab('race');
               } else if (data.qualifyingResults && data.qualifyingResults.length > 0) {
                  setActiveTab('qualifying');
               } else if (data.sprintResults && data.sprintResults.length > 0) {
                  setActiveTab('sprint');
               } else if (data.sprintQualifyingResults && data.sprintQualifyingResults.length > 0) {
                  setActiveTab('sprint_qualifying');
               }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
      }
   }, [id, searchParams]);

   // Fetch OpenF1 tyre stints, pit stops, and intervals for race and sprint sessions
   useEffect(() => {
      if (!race || (activeTab !== 'race' && activeTab !== 'sprint')) {
         setStintsByDriverCode({});
         setPitsByDriverCode({});
         setIntervalsByDriverCode({});
         setLoadingTelemetry(false);
         return;
      }

      // OpenF1 telemetry is available from 2023 onwards
      if (!race.season || race.season < 2023) {
         setStintsByDriverCode({});
         setPitsByDriverCode({});
         setIntervalsByDriverCode({});
         setLoadingTelemetry(false);
         return;
      }

      let cancelled = false;
      setLoadingTelemetry(true);

      const targetSessionName = activeTab === 'sprint' ? 'Sprint' : 'Race';

      const loadTelemetry = async () => {
         try {
            const sessions = await telemetryService.getSessions(race.season, undefined, targetSessionName);
            if (cancelled) return;

            const sessionKey = findOpenF1SessionKey(
               sessions,
               race.raceDate,
               race.circuit?.location,
               race.circuit?.country,
               race.name
            );

            if (!sessionKey) {
               if (!cancelled) {
                  setStintsByDriverCode({});
                  setPitsByDriverCode({});
                  setIntervalsByDriverCode({});
               }
               return;
            }

            const [drivers, stints, pits, intervals] = await Promise.all([
               telemetryService.getDrivers(sessionKey).catch(() => [] as OpenF1Driver[]),
               telemetryService.getStints(sessionKey).catch(() => [] as OpenF1Stint[]),
               telemetryService.getPits(sessionKey).catch(() => [] as OpenF1Pit[]),
               telemetryService.getIntervals(sessionKey).catch(() => [] as OpenF1Interval[])
            ]);

            if (cancelled) return;

            // Map driver numbers to driverCode and lastName
            const numToCode: Record<number, string> = {};
            const numToLastName: Record<number, string> = {};
            drivers.forEach((d) => {
               if (d.name_acronym) numToCode[d.driver_number] = d.name_acronym.toUpperCase();
               if (d.last_name) numToLastName[d.driver_number] = d.last_name.toLowerCase();
            });

            const resolveCode = (driverNumber: number): string | undefined => {
               let code = numToCode[driverNumber];
               if (!code) {
                  const lName = numToLastName[driverNumber];
                  const res = race.results?.find((r) => r.driverLastName?.toLowerCase() === lName);
                  if (res?.driverCode) {
                     code = res.driverCode.toUpperCase();
                  }
               }
               return code;
            };

            // Group stints by driver code
            const stintsMap: Record<string, OpenF1Stint[]> = {};
            stints.forEach((stint) => {
               if (!stint.compound) return;
               const code = resolveCode(stint.driver_number);
               if (code) {
                  if (!stintsMap[code]) stintsMap[code] = [];
                  stintsMap[code].push(stint);
               }
            });
            Object.keys(stintsMap).forEach((k) => sortStints(stintsMap[k]));

            // Group pits by driver code
            const pitsMap: Record<string, OpenF1Pit[]> = {};
            pits.forEach((pit) => {
               const code = resolveCode(pit.driver_number);
               if (code) {
                  if (!pitsMap[code]) pitsMap[code] = [];
                  pitsMap[code].push(pit);
               }
            });
            Object.keys(pitsMap).forEach((k) => {
               pitsMap[k].sort((a, b) => a.lap_number - b.lap_number);
            });

            // Group intervals by driver code (keep latest reading for final gap)
            const intervalsMap: Record<string, OpenF1Interval> = {};
            intervals.forEach((inv) => {
               const code = resolveCode(inv.driver_number);
               if (code) {
                  const existing = intervalsMap[code];
                  if (!existing || new Date(inv.date).getTime() > new Date(existing.date).getTime()) {
                     intervalsMap[code] = inv;
                  }
               }
            });

            if (!cancelled) {
               setStintsByDriverCode(stintsMap);
               setPitsByDriverCode(pitsMap);
               setIntervalsByDriverCode(intervalsMap);
            }
         } catch (err) {
            console.warn('[RaceDetail] Could not load telemetry data:', err);
            if (!cancelled) {
               setStintsByDriverCode({});
               setPitsByDriverCode({});
               setIntervalsByDriverCode({});
            }
         } finally {
            if (!cancelled) setLoadingTelemetry(false);
         }
      };

      loadTelemetry();

      return () => {
         cancelled = true;
      };
   }, [race, activeTab]);

   if (loading) return <PageSkeleton />;
   if (!race) return null;

   const hasRace = race.results && race.results.length > 0;
   const hasSprint = race.sprintResults && race.sprintResults.length > 0;
   const hasQuali = race.qualifyingResults && race.qualifyingResults.length > 0;
   const hasSprintQuali = !!(race.sprintQualifyingResults && race.sprintQualifyingResults.length > 0);
   const isSprintWeekend = !!race.sprintWeekend;
   const hasAnyResults = hasRace || hasSprint || hasQuali || hasSprintQuali;

   const getActiveResults = (): RaceResult[] => {
      switch (activeTab) {
         case 'race': return race.results;
         case 'sprint': return race.sprintResults;
         case 'qualifying': return race.qualifyingResults;
         case 'sprint_qualifying': return race.sprintQualifyingResults || [];
         default: return [];
      }
   };

   const getTabLabel = (tab: ResultTab): string => {
      switch (tab) {
         case 'race': return 'Race';
         case 'sprint': return 'Sprint';
         case 'qualifying': return 'Qualifying';
         case 'sprint_qualifying': return 'Sprint Qualifying';
      }
   };

   const getTabShortLabel = (tab: ResultTab): string => {
      switch (tab) {
         case 'race': return 'Race';
         case 'sprint': return 'Sprint';
         case 'qualifying': return 'Quali';
         case 'sprint_qualifying': return 'Sprint Quali';
      }
   };

   const tabs: ResultTab[] = [];
   if (hasRace) tabs.push('race');
   if (hasQuali) tabs.push('qualifying');
   if (hasSprint || isSprintWeekend) tabs.push('sprint');
   if (hasSprintQuali || isSprintWeekend) tabs.push('sprint_qualifying');

   const isCompleted = race.status === 'COMPLETED';
   const resultsFirst = isCompleted && hasAnyResults;
   const isQualiType = activeTab === 'qualifying' || activeTab === 'sprint_qualifying';
   const hasTyreData = !isQualiType && Object.keys(stintsByDriverCode).length > 0;
   const hasPitData = !isQualiType && (Object.keys(pitsByDriverCode).length > 0 || hasTyreData);

   const getDriverPitInfo = (code?: string, stints?: OpenF1Stint[]) => {
      if (!code) return { count: undefined, tooltip: undefined };
      const driverPits = pitsByDriverCode[code.toUpperCase()];

      if (driverPits && driverPits.length > 0) {
         const count = driverPits.length;
         const details = driverPits
            .map((p, i) => `Stop ${i + 1}: Lap ${p.lap_number}${p.pit_duration ? ` (${p.pit_duration.toFixed(1)}s)` : ''}`)
            .join(', ');
         return {
            count,
            tooltip: `${count} pit ${count === 1 ? 'stop' : 'stops'} · ${details}`
         };
      }

      // Fallback: estimate from stints count if stints are available
      if (stints && stints.length > 0) {
         const count = Math.max(0, stints.length - 1);
         return {
            count,
            tooltip: `${count} pit ${count === 1 ? 'stop' : 'stops'}`
         };
      }

      return { count: undefined, tooltip: undefined };
   };

   const getDriverInterval = (result: RaceResult) => {
      if (result.position === 1) {
         return { str: 'LEADER', isLeader: true };
      }

      // 1. Try OpenF1 live/recorded interval
      if (result.driverCode) {
         const inv = intervalsByDriverCode[result.driverCode.toUpperCase()];
         if (inv && inv.gap_to_leader !== null && inv.gap_to_leader !== undefined) {
            if (typeof inv.gap_to_leader === 'number') {
               const val = inv.gap_to_leader;
               return { str: val > 0 ? `+${val.toFixed(3)}s` : `${val}s`, isLeader: false };
            }
            if (typeof inv.gap_to_leader === 'string' && inv.gap_to_leader.trim().length > 0) {
               return { str: inv.gap_to_leader.trim(), isLeader: false };
            }
         }
      }

      // 2. Try result.time from database
      if (result.time && result.time.trim().length > 0) {
         const t = result.time.trim();
         return { str: t.startsWith('+') || t.toLowerCase().includes('lap') ? t : `+${t}`, isLeader: false };
      }

      // 3. Try result.status (e.g. "+1 Lap", "+2 Laps")
      if (result.status) {
         const s = result.status.trim();
         if (s.startsWith('+') || s.toLowerCase().includes('lap')) {
            return { str: s, isLeader: false };
         }
      }

      return { str: undefined, isLeader: false };
   };

   const circuitStats = [
      { icon: Ruler, label: 'Length', value: `${race.circuit.lengthKm} km`, wide: false },
      { icon: CornerDownRight, label: 'Corners', value: race.circuit.corners, wide: false },
      { icon: Timer, label: 'Lap Record', value: race.circuit.lapRecord, wide: true },
   ];

   return (
      <div className="flex flex-col gap-5 sm:gap-7 animate-fade-in">
         <BackButton />

         {/* ─── Race Header: Mission Control HUD ─── */}
         <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-9 shadow-2xl dot-grid">
            {/* Scanline texture */}
            <div className="scanline-overlay" />

            {/* Futuristic ambient glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Diagonal accent slash line */}
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-f1-red/[0.04] to-transparent transform skew-x-12 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
               <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
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

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase break-words">
                     {race.name}
                  </h1>

                  <p className="text-f1-silver text-xs sm:text-base font-mono mt-1.5 flex items-center gap-2 flex-wrap">
                     <Compass className="w-4 h-4 text-f1-red shrink-0" />
                     <span>{race.circuit.location}</span>
                     <span className="text-f1-silver/40">|</span>
                     <span className="text-f1-white font-semibold">{race.circuit.country}</span>
                  </p>
               </div>

               <span className="inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] tracking-[0.15em] uppercase shrink-0 self-start">
                  <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-f1-red animate-ping'}`} />
                  <span className={isCompleted ? 'text-emerald-400' : 'text-f1-red-light'}>
                     {isCompleted ? 'Session Complete' : 'Upcoming'}
                  </span>
               </span>
            </div>
         </div>

         {/* ─── Top Grid: Weekend Schedule & Circuit Telemetry (Equal Height) ─── */}
         <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch ${resultsFirst ? 'order-2' : ''}`}>
            {/* Session Schedule */}
            <div className="telemetry-card p-4 sm:p-6 relative overflow-hidden h-full flex flex-col justify-between">
               <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                  style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}
               />
               <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4">
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

                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5">
                     {race.sessions && race.sessions.length > 0 ? (
                        race.sessions.map((session) => {
                           const formatted = formatSession(session.sessionDate, session.sessionTime);
                           return (
                              <div
                                 key={session.id}
                                 className="p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all flex flex-col justify-between min-w-0"
                              >
                                 <p className="text-[11px] sm:text-xs font-mono font-semibold text-f1-silver uppercase tracking-wider mb-1 truncate">
                                    {session.sessionDisplayName}
                                 </p>
                                 <p className="text-xs sm:text-sm font-display font-bold text-f1-white">
                                    {formatted.dateStr}
                                 </p>
                                 {session.sessionTime && (
                                    <p className="text-[11px] sm:text-xs font-mono text-f1-silver/70 mt-0.5">
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
            </div>

            {/* Circuit Telemetry */}
            <div className="diagonal-card p-4 sm:p-6 relative h-full flex flex-col justify-between">
               <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: '#f59e0b' }}
               />
               <div>
                  <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.04]">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0">
                           <Radio className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono font-bold text-f1-silver/80 uppercase tracking-widest truncate">
                           Circuit Telemetry
                        </span>
                     </div>
                     <Link
                        to={`/circuits?circuit=${encodeURIComponent(race.circuit.name)}&from=race-details`}
                        className="text-[10px] sm:text-[11px] font-mono text-amber-400/80 hover:text-amber-300 transition-colors uppercase tracking-wider shrink-0"
                     >
                        Explore Circuit →
                     </Link>
                  </div>

                  <Link to={`/circuits?circuit=${encodeURIComponent(race.circuit.name)}&from=race-details`} className="block group mb-4">
                     <h4 className="text-lg sm:text-2xl font-display font-black text-f1-white group-hover:text-f1-red-light transition-colors">
                        {race.circuit.name}
                     </h4>
                  </Link>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                     {circuitStats.map(({ icon: Icon, label, value, wide }) => value && (
                        <div
                           key={label}
                           className={`flex flex-col justify-between text-sm p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] min-w-0 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}
                        >
                           <span className="flex items-center gap-1.5 text-f1-silver/70 text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-1">
                              <Icon className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />{label}
                           </span>
                           <span className="font-mono font-bold text-f1-white text-sm sm:text-base">{value}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {race.circuit.lapRecordHolder && (
                  <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between gap-3 text-xs font-mono">
                     <span className="text-f1-silver/50 uppercase tracking-wider shrink-0">Lap Record By</span>
                     <span className="font-semibold text-f1-white text-right">{race.circuit.lapRecordHolder}</span>
                  </div>
               )}
            </div>
         </div>

         {/* ─── Track Meteorology (Weather) ─── */}
         {race.weather && (
            <div className={resultsFirst ? 'order-2' : ''}>
               <WeatherCard weather={race.weather} />
            </div>
         )}

         {/* ─── Race Details: Full Width Classification Results Card ─── */}
         {hasAnyResults && (
            <div className={`telemetry-card p-3 sm:p-6 relative overflow-hidden w-full ${resultsFirst ? 'order-1' : ''}`}>
               <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-75"
                  style={{ background: 'linear-gradient(90deg, transparent, #E10600, transparent)' }}
               />

               {/* Tab Bar */}
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-5 border-b border-white/[0.06] pb-3 sm:pb-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mx-1 px-1">
                     {tabs.map((tab) => (
                        <button
                           key={tab}
                           onClick={() => setActiveTab(tab)}
                           className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider sm:tracking-widest transition-all whitespace-nowrap shrink-0 flex items-center gap-1 sm:gap-1.5 ${activeTab === tab
                              ? 'bg-f1-red text-white shadow-lg shadow-f1-red/20'
                              : 'text-f1-silver/70 hover:text-f1-white hover:bg-white/[0.04]'
                              }`}
                        >
                           {tab === 'race' && <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
                           {tab === 'qualifying' && (
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
               </div>

               {/* Qualifying / Sprint Qualifying Sub-header */}
               {isQualiType && (
                  <div className="hidden sm:flex items-center justify-end gap-2 sm:gap-6 px-2 sm:px-3 pb-2 text-[9px] sm:text-[10px] font-mono font-semibold text-f1-silver/50 uppercase tracking-[0.2em]">
                     <span className="w-20 sm:w-24 text-center">{activeTab === 'sprint_qualifying' ? 'SQ1' : 'Q1'}</span>
                     <span className="w-20 sm:w-24 text-center">{activeTab === 'sprint_qualifying' ? 'SQ2' : 'Q2'}</span>
                     <span className="w-20 sm:w-24 text-center">{activeTab === 'sprint_qualifying' ? 'SQ3' : 'Q3'}</span>
                  </div>
               )}

               {/* Race / Sprint Sub-header */}
               {!isQualiType && (
                  <div className="hidden sm:flex items-center justify-between px-2 sm:px-3 pb-2 text-[9px] sm:text-[10px] font-mono font-semibold text-f1-silver/50 uppercase tracking-[0.2em] border-b border-white/[0.04] mb-1">
                     <span className="pl-11">Driver / Team</span>
                     <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 shrink-0">
                        <span className="w-24 text-right">Interval</span>
                        <span className="w-24 sm:w-28 text-center">Best Lap</span>
                        {hasTyreData && <span className="w-36 sm:w-48 text-center">Tyres Used</span>}
                        {hasPitData && <span className="w-10 sm:w-12 text-center">Pits</span>}
                        <span className="w-8 sm:w-9 text-center">Gain</span>
                        <span className="text-right min-w-[3.25rem] sm:min-w-[3.75rem]">Points</span>
                     </div>
                  </div>
               )}

               {/* Results List */}
               <div className="space-y-1">
                  {getActiveResults().length === 0 ? (
                     <div className="py-10 sm:py-12 px-4 sm:px-6 text-center bg-white/[0.01] rounded-2xl border border-white/[0.04] space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-f1-silver/60 mx-auto flex items-center justify-center">
                           <Timer className="w-6 h-6 text-f1-silver/60" />
                        </div>
                        <div>
                           <h4 className="text-sm sm:text-base font-display font-bold text-f1-white uppercase tracking-wider mb-1">
                              No {getTabLabel(activeTab)} Classification Available
                           </h4>
                           <p className="text-f1-silver/60 font-mono text-xs max-w-md mx-auto">
                              Timing classification is not available for this session yet.
                           </p>
                        </div>
                     </div>
                  ) : (
                     getActiveResults().map((result) => {
                        const hasGridPos = typeof result.gridPosition === 'number' && result.gridPosition > 0;
                        const delta = hasGridPos ? result.gridPosition - result.position : null;
                        const driverStints = result.driverCode ? stintsByDriverCode[result.driverCode.toUpperCase()] : undefined;
                        const pitInfo = getDriverPitInfo(result.driverCode, driverStints);
                        const intervalInfo = getDriverInterval(result);

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
                           <div
                              key={result.id}
                              className={`flex items-start sm:items-center justify-between px-1.5 py-2.5 sm:p-3 rounded-xl hover:bg-white/[0.03] transition-colors group gap-2 ${isDnf ? 'bg-rose-500/[0.02]' : ''}`}
                           >
                              {/* Left: Position badge, team color bar, driver + meta */}
                              <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                 <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-mono font-bold shrink-0 ${result.position === 1 ? 'bg-amber-500/20 text-amber-400' :
                                    result.position === 2 ? 'bg-gray-400/20 text-gray-300' :
                                       result.position === 3 ? 'bg-orange-700/20 text-orange-400' :
                                          isDnf ? 'bg-rose-500/10 text-rose-400/80 border border-rose-500/20' :
                                             'bg-white/[0.04] text-f1-silver'
                                    }`}>
                                    {result.position}
                                 </span>

                                 <div
                                    className="w-1 self-stretch min-h-[1.5rem] rounded-full shrink-0"
                                    style={{ backgroundColor: result.constructorColor }}
                                 />

                                 <div className="min-w-0 flex-1">
                                    {/* Row 1: name + team (desktop) + badges. Never wraps; name truncates. */}
                                    <div className="flex items-center gap-1.5 min-w-0">
                                       <span className={`font-semibold text-xs sm:text-sm truncate min-w-0 ${isDnf ? 'text-f1-white/90' : 'text-f1-white'}`}>
                                          {result.driverFirstName} {result.driverLastName}
                                       </span>
                                       <span className="text-f1-silver/70 text-xs font-mono hidden sm:inline truncate">
                                          {result.constructorName}
                                       </span>

                                       {result.fastestLap && (
                                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded px-1.5 py-0.5 shrink-0">
                                             FL
                                          </span>
                                       )}

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
                                    </div>

                                    {/* Row 2 (mobile only): team name */}
                                    <div className="sm:hidden text-[10px] font-mono text-f1-silver/50 truncate mt-0.5">
                                       {result.constructorName}
                                    </div>

                                    {/* Row 3 (mobile only): quali times */}
                                    {isQualiType && (
                                       <div className="flex sm:hidden items-center gap-3 mt-1 font-mono text-[10px] text-f1-silver/60 flex-wrap">
                                          <span><span className="text-f1-silver/40">{activeTab === 'sprint_qualifying' ? 'SQ1' : 'Q1'}</span> {result.q1 || '—'}</span>
                                          <span><span className="text-f1-silver/40">{activeTab === 'sprint_qualifying' ? 'SQ2' : 'Q2'}</span> {result.q2 || '—'}</span>
                                          <span className="font-bold text-f1-white"><span className="text-f1-silver/40 font-normal">{activeTab === 'sprint_qualifying' ? 'SQ3' : 'Q3'}</span> {result.q3 || '—'}</span>
                                       </div>
                                    )}

                                    {/* Row 3 (mobile only): interval, tyres, pits */}
                                    {!isQualiType && (
                                       <div className="flex sm:hidden items-center gap-2 mt-1.5 font-mono text-[10px] flex-wrap">
                                          {intervalInfo.isLeader ? (
                                             <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 uppercase">
                                                Leader
                                             </span>
                                          ) : isDnf ? null : intervalInfo.str ? (
                                             <span className="text-f1-white/90 font-bold">{intervalInfo.str}</span>
                                          ) : null}

                                          {driverStints && driverStints.length > 0 && (
                                             <TyreStintBadge stints={driverStints} compact />
                                          )}

                                          {pitInfo.count !== undefined && (
                                             <span
                                                className="text-[9px] text-f1-silver/80 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.07]"
                                                title={pitInfo.tooltip}
                                             >
                                                {pitInfo.count} {pitInfo.count === 1 ? 'stop' : 'stops'}
                                             </span>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* Right: Qualifying times OR (Interval + Best Lap + Tyres + Pits + Delta + Points) */}
                              {isQualiType ? (
                                 <div className="hidden sm:flex items-center gap-2 sm:gap-6 font-mono text-xs sm:text-sm shrink-0">
                                    <span className="w-20 sm:w-24 text-center text-f1-silver/70">{result.q1 || '—'}</span>
                                    <span className="w-20 sm:w-24 text-center text-f1-silver/70">{result.q2 || '—'}</span>
                                    <span className="w-20 sm:w-24 text-center font-bold text-f1-white">{result.q3 || '—'}</span>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-2 sm:gap-6 lg:gap-8 shrink-0 self-start sm:self-center">
                                    {/* Interval to Leader (desktop only; mobile shows it under the name) */}
                                    <div className="hidden sm:block w-24 text-right shrink-0">
                                       {intervalInfo.isLeader ? (
                                          <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded px-2 py-0.5 tracking-wider uppercase inline-block">
                                             Leader
                                          </span>
                                       ) : isDnf ? (
                                          <span className="text-[10px] font-mono text-rose-400/80 uppercase font-semibold">
                                             {getDnfBadge(result.status)}
                                          </span>
                                       ) : intervalInfo.str ? (
                                          <span className="font-mono text-xs font-semibold text-f1-white/90">
                                             {intervalInfo.str}
                                          </span>
                                       ) : (
                                          <span className="font-mono text-xs text-f1-silver/30">—</span>
                                       )}
                                    </div>

                                    {/* Best Lap Time */}
                                    <div className="hidden sm:flex items-center justify-center w-24 sm:w-28 shrink-0">
                                       {result.fastestLapTime ? (
                                          <span className={
                                             result.fastestLap
                                                ? "font-mono text-xs font-bold text-purple-400 bg-purple-400/10 border border-purple-400/30 rounded px-2 py-0.5"
                                                : "font-mono text-xs text-f1-silver/70"
                                          }>
                                             {result.fastestLapTime}
                                          </span>
                                       ) : (
                                          <span className="font-mono text-xs text-f1-silver/30">—</span>
                                       )}
                                    </div>

                                    {/* Desktop Tyre Strategy */}
                                    {hasTyreData && (
                                       <div className="hidden sm:flex items-center justify-center w-36 sm:w-48">
                                          {driverStints && driverStints.length > 0 ? (
                                             <TyreStintBadge stints={driverStints} />
                                          ) : (
                                             <span className="text-[11px] font-mono text-f1-silver/30">—</span>
                                          )}
                                       </div>
                                    )}

                                    {/* Desktop Pit Stops */}
                                    {hasPitData && (
                                       <div className="hidden sm:flex items-center justify-center w-10 sm:w-12">
                                          {pitInfo.count !== undefined ? (
                                             <span
                                                className="inline-flex items-center justify-center min-w-[1.6rem] px-1.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.07] font-mono text-[11px] font-bold text-f1-white hover:border-white/[0.2] transition-colors cursor-help"
                                                title={pitInfo.tooltip}
                                             >
                                                {pitInfo.count}
                                             </span>
                                          ) : (
                                             <span className="font-mono text-[11px] text-f1-silver/30">—</span>
                                          )}
                                       </div>
                                    )}

                                    {/* Position Delta */}
                                    <div className="w-8 sm:w-9 flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold shrink-0 h-6 sm:h-auto">
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

                                    {/* Points */}
                                    <div className="text-right min-w-[2.75rem] sm:min-w-[3.75rem] shrink-0 h-6 sm:h-auto flex items-center justify-end">
                                       <span className="font-display font-black text-sm sm:text-base text-amber-400">{result.points}</span>
                                       <span className="text-f1-silver/50 text-[10px] font-mono ml-1 uppercase tracking-widest hidden min-[400px]:inline">Pts</span>
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
   );
};

export default RaceDetailPage;