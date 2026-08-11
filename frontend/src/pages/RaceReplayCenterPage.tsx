import React, { useEffect, useState } from 'react';
import { useReplay } from '../context/ReplayContext';
import { circuits } from '../data/circuits';
import { InteractiveReplayMap } from '../components/circuit/InteractiveReplayMap';
import { ReplayFeeds } from '../components/circuit/ReplayFeeds';
import { TelemetryDashboard } from '../components/circuit/TelemetryDashboard';
import { Play, Pause, Square, SkipBack, SkipForward, Radio, Flag, Trophy, Loader2 } from 'lucide-react';

/**
 * Maps OpenF1 session location / circuit_short_name values to our local circuit IDs.
 * Covers every 2024 F1 calendar venue with common aliases.
 */
const SESSION_LOCATION_TO_CIRCUIT_ID: Record<string, string> = {
   // Bahrain
   sakhir: 'bahrain', bahrain: 'bahrain',
   // Saudi Arabia
   jeddah: 'saudi-arabia', 'saudi arabia': 'saudi-arabia',
   // Australia
   melbourne: 'australia', 'albert park': 'australia', australia: 'australia',
   // Japan
   suzuka: 'japan', japan: 'japan',
   // China
   shanghai: 'china', china: 'china',
   // Miami
   miami: 'miami', 'miami gardens': 'miami',
   // Imola
   imola: 'imola',
   // Monaco
   monaco: 'monaco', 'monte carlo': 'monaco', 'monte-carlo': 'monaco',
   // Canada
   montreal: 'canada', montréal: 'canada', canada: 'canada',
   // Spain
   montmelo: 'spain', montmeló: 'spain', barcelona: 'spain', spain: 'spain',
   // Austria
   spielberg: 'austria', austria: 'austria',
   // UK
   silverstone: 'silverstone', 'great britain': 'silverstone',
   // Belgium
   stavelot: 'belgium', spa: 'belgium', 'spa-francorchamps': 'belgium', belgium: 'belgium',
   // Hungary
   budapest: 'hungary', hungary: 'hungary',
   // Netherlands
   zandvoort: 'netherlands', netherlands: 'netherlands',
   // Italy — Monza
   monza: 'monza',
   // Azerbaijan
   baku: 'azerbaijan', azerbaijan: 'azerbaijan',
   // Singapore
   'marina bay': 'singapore', singapore: 'singapore',
   // USA — Austin
   austin: 'austin',
   // Mexico
   'mexico city': 'mexico', mexico: 'mexico',
   // Brazil
   'sao paulo': 'brazil', 'são paulo': 'brazil', interlagos: 'brazil', brazil: 'brazil',
   // Las Vegas
   'las vegas': 'las-vegas',
   // Qatar
   lusail: 'qatar', qatar: 'qatar',
   // Abu Dhabi
   'abu dhabi': 'abu-dhabi', 'yas marina': 'abu-dhabi', 'yas island': 'abu-dhabi',
};

const RaceReplayCenterPage: React.FC = () => {
   const {
      activeSession,
      sessions,
      loadSessions,
      selectSession,
      isLoading,
      isPlaying,
      playbackSpeed,
      currentTime,
      progressPercent,
      play,
      pause,
      stop,
      skip,
      setSpeed,
      scrubToPercent,
      jumpToLap,
      laps,
   } = useReplay();

   const [activeTab, setActiveTab] = useState<'standings' | 'feeds' | 'radio'>('standings');
   const RACE_YEARS = [2023, 2024, 2025] as const;
   const [selectedYear, setSelectedYear] = useState<number>(2023);

   useEffect(() => {
      loadSessions(selectedYear);
   }, [selectedYear, loadSessions]);

   // Map active session's location to static circuit metadata using robust lookup
   const currentCircuit = React.useMemo(() => {
      if (!activeSession) return circuits[0];

      const sessionLoc = (activeSession.location ?? '').toLowerCase().trim();
      const circuitShort = (activeSession.circuit_short_name ?? '').toLowerCase().trim();

      // 1. Try direct lookup table match
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

      // 2. Fuzzy fallback — match circuit id or location against session location
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

   return (
      <div className="space-y-6">
         {/* Header Panel */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <div>
               <span className="text-xs font-bold text-f1-red uppercase tracking-[0.2em]">F1TV Replay Center</span>
               <h1 className="text-3xl font-display font-black text-f1-white mt-1">Race Replay Center</h1>
            </div>

            {/* Year / Session Selectors */}
            <div className="flex gap-2">
               <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-f1-mid-gray/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-f1-white focus:outline-none focus:border-f1-red/50 transition-all cursor-pointer"
               >
                  {RACE_YEARS.map((y) => (
                     <option key={y} value={y} className="bg-f1-black">
                        {y}
                     </option>
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
                     disabled={sessions.length === 0}
                  >
                     {sessions.length === 0 && <option value="">No races found</option>}
                     {sessions.map((s) => (
                        <option key={s.session_key} value={s.session_key} className="bg-f1-black">
                           {s.location} - {s.session_name}
                        </option>
                     ))}
                  </select>
               )}
            </div>
         </div>

         {/* Main Grid View */}
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Side: Map Replay & Telemetry Controls */}
            <div className="xl:col-span-2 space-y-6">
               <InteractiveReplayMap circuit={currentCircuit} />

               {/* Media Player HUD Controls */}
               <div className="rounded-2xl border border-white/10 bg-f1-dark-gray/60 p-4 shadow-xl backdrop-blur-md">
                  {/* Timeline Progress Bar / Scrubber */}
                  <div className="relative group mb-4">
                     <div className="h-1.5 w-full bg-white/[0.08] rounded-full cursor-pointer relative">
                        <div
                           className="absolute top-0 left-0 h-full bg-f1-red rounded-full"
                           style={{ width: `${progressPercent}%` }}
                        />
                        <input
                           type="range"
                           min="0"
                           max="100"
                           step="0.01"
                           value={progressPercent}
                           onChange={(e) => scrubToPercent(parseFloat(e.target.value))}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                     </div>
                     <div className="flex justify-between text-[10px] text-f1-silver mt-1.5 font-mono">
                        <span>{currentTime ? currentTime.toLocaleTimeString() : '00:00:00'}</span>
                        <span>Lap Marker Sync</span>
                     </div>
                  </div>

                  {/* Controls Button Bar */}
                  <div className="flex flex-wrap justify-between items-center gap-4">
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => skip(-10)}
                           className="rounded-lg bg-white/[0.04] border border-white/5 p-2 hover:bg-white/[0.08] transition-all text-f1-white"
                           title="Skip back 10s"
                        >
                           <SkipBack className="h-4 w-4" />
                        </button>

                        {isPlaying ? (
                           <button
                              onClick={pause}
                              className="rounded-lg bg-f1-red/10 border border-f1-red/30 p-2.5 hover:bg-f1-red/20 transition-all text-f1-red-light"
                              title="Pause"
                           >
                              <Pause className="h-5 w-5 fill-current" />
                           </button>
                        ) : (
                           <button
                              onClick={play}
                              className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 hover:bg-emerald-500/20 transition-all text-emerald-400"
                              title="Play"
                           >
                              <Play className="h-5 w-5 fill-current" />
                           </button>
                        )}

                        <button
                           onClick={stop}
                           className="rounded-lg bg-white/[0.04] border border-white/5 p-2 hover:bg-white/[0.08] transition-all text-f1-white"
                           title="Stop / Reset"
                        >
                           <Square className="h-4 w-4" />
                        </button>

                        <button
                           onClick={() => skip(10)}
                           className="rounded-lg bg-white/[0.04] border border-white/5 p-2 hover:bg-white/[0.08] transition-all text-f1-white"
                           title="Skip forward 10s"
                        >
                           <SkipForward className="h-4 w-4" />
                        </button>
                     </div>

                     {/* Speed Multipliers */}
                     <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl gap-1">
                        {([1, 2, 4, 8] as const).map((spd) => (
                           <button
                              key={spd}
                              onClick={() => setSpeed(spd)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${playbackSpeed === spd
                                 ? 'bg-f1-red text-white'
                                 : 'text-f1-silver hover:text-f1-white'
                                 }`}
                           >
                              {spd}x
                           </button>
                        ))}
                     </div>

                     {/* Jump to Lap controls */}
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-f1-silver">Jump to Lap:</span>
                        <select
                           onChange={(e) => jumpToLap(Number(e.target.value))}
                           className="bg-f1-mid-gray/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-f1-white focus:outline-none"
                        >
                           <option value="">Select...</option>
                           {laps
                              .filter((l, idx, self) => self.findIndex((t) => t.lap_number === l.lap_number) === idx)
                              .map((l) => (
                                 <option key={l.lap_number} value={l.lap_number}>
                                    Lap {l.lap_number}
                                 </option>
                              ))}
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Side: Standings, Messages & Radio Feeds */}
            <div className="rounded-2xl border border-white/10 bg-f1-dark-gray/60 p-4 shadow-xl backdrop-blur-md flex flex-col h-[580px]">
               {/* Tab Selection */}
               <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl gap-1 mb-4">
                  <button
                     onClick={() => setActiveTab('standings')}
                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === 'standings' ? 'bg-f1-red text-white' : 'text-f1-silver hover:text-f1-white'
                        }`}
                  >
                     <Trophy className="h-3.5 w-3.5" /> Standings
                  </button>
                  <button
                     onClick={() => setActiveTab('feeds')}
                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === 'feeds' ? 'bg-f1-red text-white' : 'text-f1-silver hover:text-f1-white'
                        }`}
                  >
                     <Flag className="h-3.5 w-3.5" /> Feeds
                  </button>
                  <button
                     onClick={() => setActiveTab('radio')}
                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === 'radio' ? 'bg-f1-red text-white' : 'text-f1-silver hover:text-f1-white'
                        }`}
                  >
                     <Radio className="h-3.5 w-3.5" /> Radio
                  </button>
               </div>

               {/* Feeds View Wrapper */}
               <div className="flex-1 overflow-hidden">
                  <ReplayFeeds activeTab={activeTab} />
               </div>
            </div>
         </div>

         {/* Advanced Telemetry Panel */}
         <div className="space-y-4">
            <h2 className="text-xl font-display font-black text-f1-white">Battle Mode Telemetry Comparison</h2>
            <TelemetryDashboard />
         </div>
      </div>
   );
};

export default RaceReplayCenterPage;
