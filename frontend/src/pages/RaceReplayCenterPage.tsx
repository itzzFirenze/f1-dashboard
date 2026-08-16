import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReplay } from '../context/ReplayContext';
import { circuits } from '../data/circuits';
import { InteractiveReplayMap } from '../components/circuit/InteractiveReplayMap';
import { ReplayFeeds } from '../components/circuit/ReplayFeeds';
import { TelemetryDashboard } from '../components/circuit/TelemetryDashboard';
import { Radio, Flag, Trophy, Gauge, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const SESSION_LOCATION_TO_CIRCUIT_ID: Record<string, string> = {
   sakhir: 'bahrain', bahrain: 'bahrain',
   jeddah: 'saudi-arabia', 'saudi arabia': 'saudi-arabia',
   melbourne: 'australia', 'albert park': 'australia', australia: 'australia',
   suzuka: 'japan', japan: 'japan',
   shanghai: 'china', china: 'china',
   miami: 'miami', 'miami gardens': 'miami',
   imola: 'imola',
   monaco: 'monaco', 'monte carlo': 'monaco', 'monte-carlo': 'monaco',
   montreal: 'canada', montréal: 'canada', canada: 'canada',
   montmelo: 'spain', montmeló: 'spain', barcelona: 'spain', spain: 'spain',
   spielberg: 'austria', austria: 'austria',
   silverstone: 'silverstone', 'great britain': 'silverstone',
   stavelot: 'belgium', spa: 'belgium', 'spa-francorchamps': 'belgium', belgium: 'belgium',
   budapest: 'hungary', hungary: 'hungary',
   zandvoort: 'netherlands', netherlands: 'netherlands',
   monza: 'monza',
   baku: 'azerbaijan', azerbaijan: 'azerbaijan',
   'marina bay': 'singapore', singapore: 'singapore',
   austin: 'austin',
   'mexico city': 'mexico', mexico: 'mexico',
   'sao paulo': 'brazil', 'são paulo': 'brazil', interlagos: 'brazil', brazil: 'brazil',
   'las vegas': 'las-vegas',
   lusail: 'qatar', qatar: 'qatar',
   'abu dhabi': 'abu-dhabi', 'yas marina': 'abu-dhabi', 'yas island': 'abu-dhabi',
};

const PANEL_TRANSITION = { type: 'tween' as const, duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

const RaceReplayCenterPage: React.FC = () => {
   const { activeSession, sessions, loadSessions, selectSession, isLoading, cancelledSessions } = useReplay();

   const [activeTab, setActiveTab] = useState<'standings' | 'feeds' | 'radio'>('standings');
   const [expandedPanel, setExpandedPanel] = useState<'standings' | 'telemetry'>('standings');
   const RACE_YEARS = [2023, 2024, 2025] as const;
   const [selectedYear, setSelectedYear] = useState<number>(2023);

   useEffect(() => {
      loadSessions(selectedYear);
   }, [selectedYear, loadSessions]);

   const currentCircuit = React.useMemo(() => {
      if (!activeSession) return circuits[0];

      const sessionLoc = (activeSession.location ?? '').toLowerCase().trim();
      const circuitShort = (activeSession.circuit_short_name ?? '').toLowerCase().trim();

      const idFromLoc = SESSION_LOCATION_TO_CIRCUIT_ID[sessionLoc];
      const idFromShort = SESSION_LOCATION_TO_CIRCUIT_ID[circuitShort];
      if (idFromLoc) {
         const found = circuits.find((c) => c.id === idFromLoc);
         if (found) return found;
      }
      if (idFromShort) {
         const found = circuits.find((c) => c.id === idFromShort);
         if (found) return found;
      }

      const fuzzy = circuits.find((c) => {
         const cId = c.id.toLowerCase();
         const cLoc = c.location.toLowerCase();
         return (
            cId === sessionLoc || cLoc === sessionLoc ||
            cId === circuitShort || cLoc === circuitShort ||
            sessionLoc.includes(cId) || cId.includes(sessionLoc) ||
            circuitShort.includes(cId) || cId.includes(circuitShort)
         );
      });
      return fuzzy || circuits[0];
   }, [activeSession]);

   useEffect(() => {
      if (isLoading) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = '';
      }
      return () => {
         document.body.style.overflow = '';
      };
   }, [isLoading]);

   const tabButtonClass = (tab: typeof activeTab) =>
      `flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === tab ? 'bg-f1-red text-white' : 'text-f1-silver hover:text-f1-white'
      }`;

   return (
      <div className="space-y-4 relative">
         {/* Full-page loading overlay */}
         <AnimatePresence>
            {isLoading && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-f1-black/70 backdrop-blur-sm"
                  style={{ touchAction: 'none' }}
                  onWheel={(e) => e.preventDefault()}
                  onTouchMove={(e) => e.preventDefault()}
               >
                  <Loader2 className="h-10 w-10 animate-spin text-f1-red" />
                  <span className="text-sm font-bold text-f1-white tracking-wide">Syncing feeds...</span>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Header Panel */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-3">
            <div>
               <span className="text-xs font-bold text-f1-red uppercase tracking-[0.2em]">F1TV Replay Center</span>
               <h1 className="text-2xl font-display font-black text-f1-white mt-1">Race Replay Center</h1>
            </div>

            <div className="flex gap-2">
               <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-f1-mid-gray/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-f1-white focus:outline-none focus:border-f1-red/50 transition-all cursor-pointer"
               >
                  {RACE_YEARS.map((y) => (
                     <option key={y} value={y} className="bg-f1-black">{y}</option>
                  ))}
               </select>

               {isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-f1-silver bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl">
                     <Loader2 className="h-4 w-4 animate-spin text-f1-red" /> Syncing feeds...
                  </div>
               ) : (
                  <select
                     value={activeSession?.session_key || ''}
                     onChange={(e) => {
                        const session = sessions.find((s) => s.session_key === Number(e.target.value));
                        if (session) selectSession(session);
                     }}
                     className="bg-f1-mid-gray/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-f1-white focus:outline-none focus:border-f1-red/50 transition-all cursor-pointer disabled:opacity-50"
                     disabled={sessions.length === 0 || isLoading}
                  >
                     {sessions.length === 0 && <option value="">No races found</option>}
                     {sessions.map((s) => (
                        <option key={s.session_key} value={s.session_key} className="bg-f1-black">
                           {s.location} - {s.session_name}{cancelledSessions.has(s.session_key) ? ' (No data)' : ''}
                        </option>
                     ))}
                  </select>
               )}
            </div>
         </div>

         {/* Main Grid — circuit | telemetry/standings toggle group */}
         {activeSession && cancelledSessions.has(activeSession.session_key) ? (
            <div className="rounded-2xl border border-white/10 bg-f1-dark-gray/60 p-10 text-center">
               <Flag className="h-8 w-8 text-f1-silver mx-auto mb-3" />
               <h3 className="text-sm font-bold text-f1-white">No timing data available</h3>
               <p className="text-xs text-f1-silver mt-1">
                  This session has no recorded data and may have been cancelled or postponed.
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
               {/* Circuit map with docked media player */}
               <div className="xl:col-span-7">
                  <InteractiveReplayMap circuit={currentCircuit} />
               </div>

               {/* Toggle group: one panel expanded, the other a collapsed vertical tab */}
               <div className="xl:col-span-5 flex gap-3 h-[590px] overflow-hidden">
                  {/* Battle Telemetry */}
                  <motion.div
                     animate={{
                        flexGrow: expandedPanel === 'telemetry' ? 1 : 0,
                        flexBasis: expandedPanel === 'telemetry' ? '0%' : '56px',
                     }}
                     transition={PANEL_TRANSITION}
                     className="min-w-0 rounded-2xl border border-white/10 bg-f1-dark-gray/60 shadow-xl backdrop-blur-md h-full overflow-hidden"
                     style={{ flexShrink: 0 }}
                  >
                     <AnimatePresence mode="wait" initial={false}>
                        {expandedPanel === 'telemetry' ? (
                           <motion.div
                              key="telemetry-expanded"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15, delay: expandedPanel === 'telemetry' ? 0.15 : 0 }}
                              className="p-3 flex flex-col h-full w-[280px] xl:w-full"
                           >
                              <button
                                 onClick={() => setExpandedPanel('standings')}
                                 className="flex items-center justify-between mb-2 px-1 group shrink-0"
                                 title="Collapse Battle Telemetry"
                              >
                                 <h2 className="text-[11px] font-display font-black text-f1-white uppercase tracking-wider">
                                    Battle Telemetry
                                 </h2>
                                 <ChevronLeft className="h-4 w-4 text-f1-silver group-hover:text-f1-white transition-colors" />
                              </button>
                              <div className="flex-1 overflow-y-auto pr-0.5">
                                 <TelemetryDashboard />
                              </div>
                           </motion.div>
                        ) : (
                           <motion.button
                              key="telemetry-collapsed"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.12, delay: 0.12 }}
                              onClick={() => setExpandedPanel('telemetry')}
                              className="w-14 h-full flex flex-col items-center justify-between py-4 hover:bg-white/[0.03] hover:border-f1-red/30 transition-colors group"
                              title="Expand Battle Telemetry"
                           >
                              <Gauge className="h-4 w-4 text-f1-silver group-hover:text-f1-red-light transition-colors shrink-0" />
                              <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-wider text-f1-silver group-hover:text-f1-white transition-colors whitespace-nowrap">
                                 Battle Telemetry
                              </span>
                              <ChevronRight className="h-4 w-4 text-f1-silver group-hover:text-f1-red-light transition-colors shrink-0" />
                           </motion.button>
                        )}
                     </AnimatePresence>
                  </motion.div>

                  {/* Standings / Feeds / Radio */}
                  <motion.div
                     animate={{
                        flexGrow: expandedPanel === 'standings' ? 1 : 0,
                        flexBasis: expandedPanel === 'standings' ? '0%' : '56px',
                     }}
                     transition={PANEL_TRANSITION}
                     className="min-w-0 rounded-2xl border border-white/10 bg-f1-dark-gray/60 shadow-xl backdrop-blur-md h-full overflow-hidden"
                     style={{ flexShrink: 0 }}
                  >
                     <AnimatePresence mode="wait" initial={false}>
                        {expandedPanel === 'standings' ? (
                           <motion.div
                              key="standings-expanded"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15, delay: 0.15 }}
                              className="p-4 flex flex-col h-full w-[320px] xl:w-full"
                           >
                              <div className="flex items-center gap-2 mb-3 shrink-0">
                                 <div className="flex flex-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl gap-1">
                                    <button onClick={() => setActiveTab('standings')} className={tabButtonClass('standings')}>
                                       <Trophy className="h-3.5 w-3.5" /> Standings
                                    </button>
                                    <button onClick={() => setActiveTab('feeds')} className={tabButtonClass('feeds')}>
                                       <Flag className="h-3.5 w-3.5" /> Feeds
                                    </button>
                                    <button onClick={() => setActiveTab('radio')} className={tabButtonClass('radio')}>
                                       <Radio className="h-3.5 w-3.5" /> Radio
                                    </button>
                                 </div>
                                 <button
                                    onClick={() => setExpandedPanel('telemetry')}
                                    className="shrink-0 p-2 rounded-lg bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] transition-all text-f1-silver hover:text-f1-white"
                                    title="Collapse"
                                 >
                                    <ChevronRight className="h-4 w-4" />
                                 </button>
                              </div>

                              <div className="flex-1 overflow-hidden">
                                 <ReplayFeeds activeTab={activeTab} circuit={currentCircuit} />
                              </div>
                           </motion.div>
                        ) : (
                           <motion.button
                              key="standings-collapsed"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.12, delay: 0.12 }}
                              onClick={() => setExpandedPanel('standings')}
                              className="w-14 h-full flex flex-col items-center justify-between py-4 hover:bg-white/[0.03] hover:border-f1-red/30 transition-colors group"
                              title="Expand Standings"
                           >
                              <Trophy className="h-4 w-4 text-f1-silver group-hover:text-f1-red-light transition-colors shrink-0" />
                              <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-wider text-f1-silver group-hover:text-f1-white transition-colors whitespace-nowrap">
                                 Standings · Feeds · Radio
                              </span>
                              <ChevronLeft className="h-4 w-4 text-f1-silver group-hover:text-f1-red-light transition-colors shrink-0" />
                           </motion.button>
                        )}
                     </AnimatePresence>
                  </motion.div>
               </div>
            </div>
         )}
      </div>
   );
};

export default RaceReplayCenterPage;
