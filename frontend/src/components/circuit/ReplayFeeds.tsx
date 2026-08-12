import React, { useMemo, useState } from 'react';
import { useReplay } from '../../context/ReplayContext';
import { Flag, ShieldAlert, Radio, AlertTriangle, Play, Pause, HelpCircle } from 'lucide-react';

interface ReplayFeedsProps {
   activeTab: 'standings' | 'feeds' | 'radio';
}

const CheckeredFlagIcon: React.FC<{ className?: string }> = ({ className }) => (
   <svg viewBox="0 0 16 16" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="0" width="1.5" height="16" fill="currentColor" opacity="0.6" />
      <rect x="2.5" y="1" width="2" height="2" fill="currentColor" />
      <rect x="6.5" y="1" width="2" height="2" fill="currentColor" />
      <rect x="10.5" y="1" width="2" height="2" fill="white" />
      <rect x="4.5" y="3" width="2" height="2" fill="white" />
      <rect x="8.5" y="3" width="2" height="2" fill="white" />
      <rect x="2.5" y="5" width="2" height="2" fill="currentColor" />
      <rect x="6.5" y="5" width="2" height="2" fill="currentColor" />
      <rect x="10.5" y="5" width="2" height="2" fill="currentColor" />
      <rect x="4.5" y="7" width="2" height="2" fill="white" />
      <rect x="8.5" y="7" width="2" height="2" fill="white" />
   </svg>
);

export const ReplayFeeds: React.FC<ReplayFeedsProps> = ({ activeTab }) => {
   const {
      drivers,
      driverLocations,
      stints,
      pits,
      raceControl,
      teamRadios,
      currentTime,
      jumpToLap,
      laps,
      isDriverOutAt,
   } = useReplay();

   const totalLapsByDriver = useMemo(() => {
      const map: Record<number, number> = {};
      for (const l of laps) {
         map[l.driver_number] = Math.max(map[l.driver_number] || 0, l.lap_number);
      }
      return map;
   }, [laps]);

   const liveStandings = useMemo(() => {
      if (!currentTime) return [];
      const nowMs = currentTime.getTime();

      return drivers
         .map((drv) => {
            const driverLaps = laps.filter(
               (l) =>
                  l.driver_number === drv.driver_number &&
                  l.date_start &&
                  new Date(l.date_start).getTime() <= nowMs
            );

            const lapsCompleted = driverLaps.length;

            const activeLap = driverLaps.reduce<typeof driverLaps[0] | null>((latest, l) => {
               if (!latest) return l;
               return new Date(l.date_start!).getTime() > new Date(latest.date_start!).getTime() ? l : latest;
            }, null);

            let lapProgress = 0;
            let activeLapStartMs = Infinity;
            let activeLapEndMs = Infinity;

            if (activeLap?.date_start) {
               const lapStartMs = new Date(activeLap.date_start).getTime();
               activeLapStartMs = lapStartMs;

               const lapDurationSec = activeLap.lap_duration && activeLap.lap_duration > 0 ? activeLap.lap_duration : 90;
               activeLapEndMs = lapStartMs + lapDurationSec * 1000;

               const elapsedSec = Math.max(0, (nowMs - lapStartMs) / 1000);
               lapProgress = elapsedSec / (elapsedSec + lapDurationSec);
            }

            const raceDistance = Math.max(0, lapsCompleted - 1) + lapProgress;

            const driverStints = stints.filter((s) => s.driver_number === drv.driver_number);
            const activeStint =
               driverStints.find((s) => lapsCompleted >= s.lap_start && lapsCompleted <= s.lap_end) ||
               driverStints[driverStints.length - 1];

            const isOut = isDriverOutAt(drv.driver_number, currentTime);

            // Finished = this driver reached the LAST lap they ever recorded
            // in the data (which may be fewer than the leader's, if lapped)
            // and current time has actually passed that lap's end — not
            // "reached the leader's lap count", which lapped drivers never do.
            const driverTotalLaps = totalLapsByDriver[drv.driver_number] || 0;
            const isFinished =
               !isOut &&
               driverTotalLaps > 0 &&
               activeLap?.lap_number === driverTotalLaps &&
               nowMs >= activeLapEndMs;

            return {
               ...drv,
               tyre: isOut ? 'DNF' : (activeStint?.compound || 'UNKNOWN'),
               stintAge: activeStint?.tyre_age_at_start || 0,
               lapsCompleted,
               raceDistance,
               activeLapStartMs,
               isOut,
               isFinished,
            };
         })
         .sort((a, b) => {
            if (a.isOut !== b.isOut) return a.isOut ? 1 : -1;
            if (b.raceDistance !== a.raceDistance) return b.raceDistance - a.raceDistance;
            return a.activeLapStartMs - b.activeLapStartMs;
         });
   }, [drivers, laps, stints, currentTime, isDriverOutAt, totalLapsByDriver]);

   const [playingUrl, setPlayingUrl] = useState<string | null>(null);
   const [playbackProgress, setPlaybackProgress] = useState(0);
   const audioRef = React.useRef<HTMLAudioElement | null>(null);

   const toggleRadio = (url: string) => {
      // Clicking the currently-playing clip pauses it.
      if (playingUrl === url) {
         audioRef.current?.pause();
         setPlayingUrl(null);
         return;
      }

      // Switching clips — stop whatever's playing, then play the new one.
      if (audioRef.current) {
         audioRef.current.pause();
      }

      const audio = new Audio(url);

      audio.ontimeupdate = () => {
         if (audio.duration > 0) {
            setPlaybackProgress((audio.currentTime / audio.duration) * 100);
         }
      };
      audio.onended = () => {
         setPlayingUrl(null);
         setPlaybackProgress(0);
      };
      audio.onerror = () => {
         setPlayingUrl(null);
         setPlaybackProgress(0);
      };

      audioRef.current = audio;
      setPlaybackProgress(0);
      void audio.play();
      setPlayingUrl(url);
   };

   // Stop playback if the user navigates away from the Radio tab or unmounts.
   React.useEffect(() => {
      return () => {
         audioRef.current?.pause();
      };
   }, []);

   // 2. Active Race Control feeds up to currentTime
   const activeControlMessages = useMemo(() => {
      if (!currentTime) return [];
      return raceControl
         .filter((msg) => new Date(msg.date) <= currentTime)
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 20); // Show last 20 messages
   }, [raceControl, currentTime]);

   // 3. Audio radios up to currentTime
   const activeRadioMessages = useMemo(() => {
      if (!currentTime) return [];
      return teamRadios
         .filter((radio) => new Date(radio.date) <= currentTime)
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 15);
   }, [teamRadios, currentTime]);

   if (activeTab === 'standings') {
      return (
         <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            <h4 className="text-xs uppercase tracking-wider text-f1-silver mb-2">Live Timing Standings</h4>
            <div className="space-y-1.5">
               {liveStandings.map((drv, idx) => {
                  const teamColor = `#${drv.team_colour}`;
                  return (
                     <div
                        key={drv.driver_number}
                        className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-2 hover:bg-white/[0.05] transition-all"
                     >
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-f1-silver w-4">{idx + 1}</span>
                           <div className="w-1 h-5 rounded-full" style={{ backgroundColor: teamColor }} />
                           <span className="text-sm font-bold text-f1-white font-mono">{drv.name_acronym}</span>
                           <span className="text-[10px] text-f1-silver">{drv.team_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {drv.isFinished && (
                              <span title="Finished" className="shrink-0">
                                 <CheckeredFlagIcon className="h-3 w-3 text-f1-white" />
                              </span>
                           )}
                           <span className="text-[10px] text-f1-silver font-mono">L{drv.lapsCompleted}</span>
                           {/* Tyre badge */}
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${drv.tyre === 'DNF'
                              ? 'bg-red-500/25 text-red-500'
                              : drv.tyre === 'SOFT'
                                 ? 'bg-red-500/25 text-red-400'
                                 : drv.tyre === 'MEDIUM'
                                    ? 'bg-yellow-500/25 text-yellow-400'
                                    : drv.tyre === 'HARD'
                                       ? 'bg-white/20 text-white'
                                       : drv.tyre === 'INTERMEDIATE'
                                          ? 'bg-green-500/25 text-green-400'
                                          : 'bg-green-500/25 text-blue-400'
                              }`}>
                              {drv.tyre === 'DNF' ? 'DNF' : drv.tyre[0]}
                           </span>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      );
   }

   if (activeTab === 'feeds') {
      return (
         <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            <h4 className="text-xs uppercase tracking-wider text-f1-silver mb-2">Race Control messages</h4>
            {activeControlMessages.length === 0 ? (
               <p className="text-xs text-f1-silver/50 text-center py-4">No active messages</p>
            ) : (
               <div className="space-y-2">
                  {activeControlMessages.map((msg, i) => {
                     const isWarning = msg.flag === 'YELLOW' || msg.flag === 'RED' || msg.message.includes('INVESTIGATION');
                     return (
                        <div
                           key={i}
                           className={`rounded-lg border p-3 flex gap-3 items-start transition-all ${isWarning ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-white/[0.02] border-white/5 text-f1-silver'
                              }`}
                        >
                           {isWarning ? (
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                           ) : (
                              <ShieldAlert className="h-4 w-4 shrink-0 text-f1-silver mt-0.5" />
                           )}
                           <div>
                              <span className="block text-[9px] text-f1-silver/70 font-mono">
                                 LAP {msg.lap_number} - {new Date(msg.date).toLocaleTimeString()}
                              </span>
                              <p className="text-xs mt-1 font-medium leading-relaxed">{msg.message}</p>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      );
   }

   return (
      <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
         <h4 className="text-xs uppercase tracking-wider text-f1-silver mb-2">Team Radio Archive</h4>
         {activeRadioMessages.length === 0 ? (
            <p className="text-xs text-f1-silver/50 text-center py-4">No radios recorded yet</p>
         ) : (
            <div className="space-y-2">
               {activeRadioMessages.map((radio, i) => {
                  const driver = drivers.find((d) => d.driver_number === radio.driver_number);
                  return (
                     <div
                        key={i}
                        className="rounded-lg bg-white/[0.02] border border-white/5 p-3 hover:bg-white/[0.05] transition-all"
                     >
                        <div className="flex justify-between items-center">
                           <div className="flex gap-3 items-center">
                              <Radio className="h-4 w-4 text-f1-red shrink-0" />
                              <div>
                                 <span className="text-xs font-bold text-f1-white">
                                    {driver?.broadcast_name || `Driver ${radio.driver_number}`}
                                 </span>
                                 <span className="block text-[9px] text-f1-silver font-mono">
                                    {new Date(radio.date).toLocaleTimeString()}
                                 </span>
                              </div>
                           </div>
                           <button
                              onClick={() => toggleRadio(radio.recording_url)}
                              className="rounded bg-f1-red/10 border border-f1-red/30 p-1.5 hover:bg-f1-red/20 transition-all text-f1-red-light"
                           >
                              {playingUrl === radio.recording_url ? (
                                 <Pause className="h-3 w-3 fill-current" />
                              ) : (
                                 <Play className="h-3 w-3 fill-current" />
                              )}
                           </button>
                        </div>

                        {/* Playback timeline — only shown for the active clip */}
                        {playingUrl === radio.recording_url && (
                           <div className="mt-2 h-1 w-full bg-white/[0.08] rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-f1-red rounded-full transition-all duration-150"
                                 style={{ width: `${playbackProgress}%` }}
                              />
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};